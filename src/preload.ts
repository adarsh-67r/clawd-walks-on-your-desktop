const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clawd', {
  onCursor: (cb: (pos: { x: number; y: number }) => void) =>
    ipcRenderer.on('cursor-pos', (_e: unknown, pos: { x: number; y: number }) => cb(pos)),

  onState: (cb: (state: Record<string, unknown>) => void) =>
    ipcRenderer.on('system-state', (_e: unknown, state: Record<string, unknown>) => cb(state)),

  onTokenStats: (cb: (stats: Record<string, unknown>) => void) =>
    ipcRenderer.on('token-stats', (_e: unknown, stats: Record<string, unknown>) => cb(stats)),

  setIgnoreMouseEvents: (ignore: boolean, opts?: { forward: boolean }) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, opts),

  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),

  walkTo: (x: number, y: number) => ipcRenderer.send('walk-to', x, y),
  startDrag: (offsetX: number, offsetY: number) => ipcRenderer.send('drag-start', offsetX, offsetY),
  dragMove: (screenX: number, screenY: number) => ipcRenderer.send('drag-move', screenX, screenY),

  openClaude: () => ipcRenderer.send('open-claude'),

  onClipboardCopy: (cb: () => void) => ipcRenderer.on('clipboard-copy', () => cb()),
  onClipboardPaste: (cb: () => void) => ipcRenderer.on('clipboard-paste', () => cb()),
  onScreenshot: (cb: () => void) => ipcRenderer.on('screenshot-taken', () => cb()),
});
