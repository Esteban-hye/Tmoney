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
  exportPdf: (html, filename) => ipcRenderer.invoke('export:pdf', html, filename),
  syncSignUp: (email, pwd) => ipcRenderer.invoke('sync:signup', email, pwd),
  syncSignIn: (email, pwd) => ipcRenderer.invoke('sync:signin', email, pwd),
  syncRecover: (email, pwd, rk, newPwd) => ipcRenderer.invoke('sync:recover', email, pwd, rk, newPwd),
  syncRestore: saved => ipcRenderer.invoke('sync:restore', saved),
  syncSignOut: () => ipcRenderer.invoke('sync:signout'),
  syncStatus: () => ipcRenderer.invoke('sync:status'),
  syncPull: since => ipcRenderer.invoke('sync:pull', since),
  syncPush: records => ipcRenderer.invoke('sync:push', records),
  syncWipe: () => ipcRenderer.invoke('sync:wipe')
});
