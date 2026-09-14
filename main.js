const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { getRawSystemInfo, deriveState } = require('./lib/systemState');
const { getTokenSummary } = require('./lib/tokenStats');

const WIN_W = 220;
const WIN_H = 260;

let win;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x: width - WIN_W - 24,
    y: height - WIN_H - 24,
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
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Global cursor position, polled so eyes can track the mouse even when
  // it's outside our (mostly click-through) window.
  setInterval(() => {
    if (win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    win.webContents.send('cursor-pos', p);
  }, 33);

  const pollSystemState = async () => {
    try {
      const raw = await getRawSystemInfo();
      const state = deriveState(raw, process.pid);
      if (!win.isDestroyed()) win.webContents.send('system-state', state);
    } catch (e) {
      console.error('system-state poll failed:', e.message);
    }
  };
  pollSystemState();
  setInterval(pollSystemState, 2500);

  const pollTokenStats = async () => {
    try {
      const stats = await getTokenSummary();
      if (!win.isDestroyed()) win.webContents.send('token-stats', stats);
    } catch (e) {
      console.error('token-stats poll failed:', e.message);
    }
  };
  pollTokenStats();
  setInterval(pollTokenStats, 60000);

  // Global keypress detection (Ctrl+C, Ctrl+V, PrtSc, Win+Shift+S)
  const keyProc = spawn('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'lib', 'detect-keys.ps1'),
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });

  let keyBuf = '';
  keyProc.stdout.on('data', (chunk) => {
    keyBuf += chunk.toString();
    const lines = keyBuf.split('\n');
    keyBuf = lines.pop();
    for (const line of lines) {
      const cmd = line.trim();
      if (!win.isDestroyed()) {
        if (cmd === 'copy') win.webContents.send('clipboard-copy');
        if (cmd === 'paste') win.webContents.send('clipboard-paste');
        if (cmd === 'screenshot') win.webContents.send('screenshot-taken');
      }
    }
  });

  app.on('before-quit', () => { keyProc.kill(); });
}

ipcMain.on('set-ignore-mouse-events', (_e, ignore, opts) => {
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(ignore, opts);
});

ipcMain.handle('get-window-bounds', () => win.getBounds());

// ---------- dragging ----------
let dragOffset = null;

ipcMain.on('drag-start', (_e, offsetX, offsetY) => {
  dragOffset = { x: offsetX, y: offsetY };
});

ipcMain.on('drag-move', (_e, screenX, screenY) => {
  if (!dragOffset || !win || win.isDestroyed()) return;
  win.setPosition(
    Math.round(screenX - dragOffset.x),
    Math.round(screenY - dragOffset.y)
  );
});

// ---------- open Claude Desktop ----------
ipcMain.on('open-claude', () => {
  const { exec } = require('child_process');
  exec('start claude:', { windowsHide: true });
});

// ---------- walking ----------
ipcMain.handle('get-screen-bounds', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

ipcMain.on('walk-to', (_e, x, y) => {
  if (!win || win.isDestroyed()) return;
  win.setPosition(Math.round(x), Math.round(y));
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
