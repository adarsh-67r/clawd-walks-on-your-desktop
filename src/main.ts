import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import config from './engine/config';
import { getRawSystemInfo, deriveState } from './sensors/system-state';
import { getTokenSummary } from './sensors/token-stats';
import { createKeypressSensor } from './sensors/keypress';

let win: BrowserWindow;

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const { window: winConfig } = config;

  win = new BrowserWindow({
    width: winConfig.width,
    height: winConfig.height,
    x: width - winConfig.width - winConfig.margin,
    y: height - winConfig.height - winConfig.margin,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Cursor tracking
  setInterval(() => {
    if (win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    win.webContents.send('cursor-pos', p);
  }, config.poll.cursor);

  // System state polling
  const pollSystemState = async (): Promise<void> => {
    try {
      const raw = await getRawSystemInfo();
      const state = deriveState(raw, process.pid);
      if (!win.isDestroyed()) win.webContents.send('system-state', state);
    } catch (e) {
      console.error('system-state poll failed:', (e as Error).message);
    }
  };
  pollSystemState();
  setInterval(pollSystemState, config.poll.systemState);

  // Token stats polling
  const pollTokenStats = async (): Promise<void> => {
    try {
      const stats = await getTokenSummary();
      if (!win.isDestroyed()) win.webContents.send('token-stats', stats);
    } catch (e) {
      console.error('token-stats poll failed:', (e as Error).message);
    }
  };
  pollTokenStats();
  setInterval(pollTokenStats, config.poll.tokens);

  // Keypress sensor
  const keys = createKeypressSensor();
  keys.onKey((cmd) => {
    if (win.isDestroyed()) return;
    if (cmd === 'copy') win.webContents.send('clipboard-copy');
    if (cmd === 'paste') win.webContents.send('clipboard-paste');
    if (cmd === 'screenshot') win.webContents.send('screenshot-taken');
  });

  app.on('before-quit', () => keys.destroy());
}

// IPC handlers
ipcMain.on('set-ignore-mouse-events', (_e, ignore: boolean, opts?: { forward: boolean }) => {
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(ignore, opts);
});

ipcMain.handle('get-window-bounds', () => win.getBounds());

// Dragging
let dragOffset: { x: number; y: number } | null = null;

ipcMain.on('drag-start', (_e, offsetX: number, offsetY: number) => {
  dragOffset = { x: offsetX, y: offsetY };
});

ipcMain.on('drag-move', (_e, screenX: number, screenY: number) => {
  if (!dragOffset || !win || win.isDestroyed()) return;
  win.setPosition(
    Math.round(screenX - dragOffset.x),
    Math.round(screenY - dragOffset.y)
  );
});

// Open Claude Desktop
ipcMain.on('open-claude', () => {
  exec('start claude:', { windowsHide: true });
});

// Walking
ipcMain.handle('get-screen-bounds', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

ipcMain.on('walk-to', (_e, x: number, y: number) => {
  if (!win || win.isDestroyed()) return;
  win.setPosition(Math.round(x), Math.round(y));
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
