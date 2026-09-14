const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clawd', {
  onCursor: (cb) => ipcRenderer.on('cursor-pos', (_e, pos) => cb(pos)),
  onState: (cb) => ipcRenderer.on('system-state', (_e, state) => cb(state)),
  onTokenStats: (cb) => ipcRenderer.on('token-stats', (_e, stats) => cb(stats)),
  setIgnoreMouseEvents: (ignore, opts) => ipcRenderer.send('set-ignore-mouse-events', ignore, opts),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),
  walkTo: (x, y) => ipcRenderer.send('walk-to', x, y),
  startDrag: (offsetX, offsetY) => ipcRenderer.send('drag-start', offsetX, offsetY),
  dragMove: (screenX, screenY) => ipcRenderer.send('drag-move', screenX, screenY),
  openClaude: () => ipcRenderer.send('open-claude'),
  onClipboardCopy: (cb) => ipcRenderer.on('clipboard-copy', () => cb()),
  onClipboardPaste: (cb) => ipcRenderer.on('clipboard-paste', () => cb()),
  onScreenshot: (cb) => ipcRenderer.on('screenshot-taken', () => cb()),
});
