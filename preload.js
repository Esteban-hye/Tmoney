const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tmoney', {
  exists: () => ipcRenderer.invoke('vault:exists'),
  create: (pin, data) => ipcRenderer.invoke('vault:create', pin, data),
  unlock: pin => ipcRenderer.invoke('vault:unlock', pin),
  save: data => ipcRenderer.invoke('vault:save', data),
  changePin: (oldPin, newPin, data) => ipcRenderer.invoke('vault:changePin', oldPin, newPin, data),
  lock: () => ipcRenderer.invoke('vault:lock'),
  reset: () => ipcRenderer.invoke('vault:reset'),
  exportXlsx: payload => ipcRenderer.invoke('export:xlsx', payload),
  importXlsx: () => ipcRenderer.invoke('import:xlsx'),
  version: () => ipcRenderer.invoke('app:version'),
  checkUpdate: silent => ipcRenderer.invoke('update:check', silent),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdate: cb => ipcRenderer.on('update:status', (_e, data) => cb(data)),
  exportPdf: (html, filename) => ipcRenderer.invoke('export:pdf', html, filename)
});
