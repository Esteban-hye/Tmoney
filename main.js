const { app, BrowserWindow, Menu, ipcMain, dialog, shell, clipboard, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { autoUpdater } = require('electron-updater');
const sync = require('./sync');

const MAC = process.platform === 'darwin';

const VAULT = () => path.join(app.getPath('userData'), 'tmoney.vault');
const DEVICE = () => path.join(app.getPath('userData'), 'device.key');
let win = null;
let key = null;
let salt = null;
let fails = 0;
let lockUntil = 0;

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1050, minHeight: 700,
    title: 'Tmoney',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#0b1120',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  if (!MAC) win.removeMenu();
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

if (!MAC) app.setAppUserModelId('com.tmoney.app');
// Sur macOS, sans menu d'application, Cmd+C / Cmd+V / Cmd+Q ne fonctionnent pas.
if (MAC) Menu.setApplicationMenu(Menu.buildFromTemplate([
  { role: 'appMenu', label: 'Tmoney' },
  { role: 'editMenu', label: 'Édition' },
  { role: 'windowMenu', label: 'Fenêtre' }
]));
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged && updatesConfigured()) setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 4000);
});
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

// ---- Coffre chiffré (AES-256-GCM, clé dérivée du PIN + secret propre à la machine) ----
// Le secret machine est protégé par le système (DPAPI sous Windows, Trousseau sous macOS) : un coffre copié sur un autre PC
// reste illisible, même avec le bon code PIN.
let bound = false;
function deviceSecret() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    if (fs.existsSync(DEVICE())) return safeStorage.decryptString(fs.readFileSync(DEVICE()));
    const s = crypto.randomBytes(32).toString('base64');
    fs.mkdirSync(path.dirname(DEVICE()), { recursive: true });
    fs.writeFileSync(DEVICE(), safeStorage.encryptString(s));
    return s;
  } catch { return null; }
}
const pinKey = (pin, s) => crypto.pbkdf2Sync(String(pin), s, 300000, 32, 'sha256');
function derive(pin, s, useDevice) {
  const k = pinKey(pin, s);
  if (!useDevice) return k;
  const secret = deviceSecret();
  if (!secret) throw new Error('no-device-key');
  return crypto.createHash('sha256').update(Buffer.concat([k, Buffer.from(secret, 'base64')])).digest();
}

function writeVault(data) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final()]);
  const out = JSON.stringify({ v: 2, bound, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: enc.toString('base64') });
  fs.mkdirSync(path.dirname(VAULT()), { recursive: true });
  fs.writeFileSync(VAULT() + '.tmp', out);
  fs.renameSync(VAULT() + '.tmp', VAULT());
}

function readVault(pin) {
  const f = JSON.parse(fs.readFileSync(VAULT(), 'utf8'));
  const s = Buffer.from(f.salt, 'base64');
  if (f.bound && !fs.existsSync(DEVICE())) throw new Error('other-device');
  const k = derive(pin, s, !!f.bound);
  const d = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(f.iv, 'base64'));
  d.setAuthTag(Buffer.from(f.tag, 'base64'));
  const txt = Buffer.concat([d.update(Buffer.from(f.data, 'base64')), d.final()]).toString('utf8');
  return { data: JSON.parse(txt), k, s, bound: !!f.bound };
}

ipcMain.handle('vault:exists', () => fs.existsSync(VAULT()));

ipcMain.handle('vault:create', (_e, pin, data) => {
  if (fs.existsSync(VAULT())) throw new Error('exists');
  salt = crypto.randomBytes(16);
  bound = !!deviceSecret();
  key = derive(pin, salt, bound);
  writeVault(data);
  return true;
});

ipcMain.handle('vault:unlock', (_e, pin) => {
  const now = Date.now();
  if (now < lockUntil) return { error: 'wait', seconds: Math.ceil((lockUntil - now) / 1000) };
  try {
    const r = readVault(pin);
    key = r.k; salt = r.s; bound = r.bound; fails = 0;
    // Coffre créé avant cette version : on le lie à la machine au premier déverrouillage
    if (!bound && deviceSecret()) {
      bound = true;
      key = derive(pin, salt, true);
      writeVault(r.data);
    }
    return { data: r.data };
  } catch (e) {
    if (e.message === 'other-device') return { error: 'other-device' };
    fails++;
    if (fails >= 5) { fails = 0; lockUntil = now + 30000; return { error: 'wait', seconds: 30 }; }
    return { error: 'pin', left: 5 - fails };
  }
});

ipcMain.handle('vault:save', (_e, data) => {
  if (!key) throw new Error('locked');
  writeVault(data);
  return true;
});

ipcMain.handle('vault:changePin', (_e, oldPin, newPin, data) => {
  if (!key) throw new Error('locked');
  const check = derive(oldPin, salt, bound);
  if (!crypto.timingSafeEqual(check, key)) return false;
  salt = crypto.randomBytes(16);
  key = derive(newPin, salt, bound);
  writeVault(data);
  return true;
});

ipcMain.handle('vault:lock', () => { key = null; return true; });

ipcMain.handle('vault:reset', async () => {
  const r = await dialog.showMessageBox(win, {
    type: 'warning', buttons: ['Annuler', 'Tout effacer'], defaultId: 0, cancelId: 0,
    title: 'Code PIN oublié',
    message: 'Réinitialiser Tmoney ?',
    detail: 'Tes données sont chiffrées avec ton code PIN : sans lui, elles ne peuvent pas être récupérées. Toutes les données seront définitivement effacées.'
  });
  if (r.response !== 1) return false;
  fs.rmSync(VAULT(), { force: true });
  key = null; salt = null;
  return true;
});

// ---- Import Excel (export Tmoney) ----
ipcMain.handle('import:xlsx', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(win, {
    title: 'Importer un fichier Tmoney', properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (canceled || !filePaths?.length) return null;
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePaths[0]);
  const out = {};
  wb.eachSheet(ws => {
    const headers = (ws.getRow(1).values || []).slice(1).map(h => String(h ?? '').trim());
    const rows = [];
    for (let i = 2; i <= ws.rowCount; i++) {
      const vals = (ws.getRow(i).values || []).slice(1);
      if (!vals.some(v => v !== null && v !== undefined && v !== '')) continue;
      const o = {};
      headers.forEach((h, j) => {
        let v = vals[j];
        if (v && typeof v === 'object') v = v.text ?? v.result ?? v.richText?.map(r => r.text).join('') ?? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
        o[h] = v ?? '';
      });
      rows.push(o);
    }
    out[ws.name] = rows;
  });
  return { file: filePaths[0], sheets: out };
});

// ---- Mises à jour (GitHub Releases) ----
// electron-builder retire le champ "build" du package.json empaqueté : on se fie au fichier
// app-update.yml qu'il dépose dans les ressources quand une cible de publication est configurée.
const updatesConfigured = () => {
  try { return app.isPackaged && fs.existsSync(path.join(process.resourcesPath, 'app-update.yml')); } catch { return false; }
};
// macOS refuse d'installer une mise à jour non signée par un compte Apple Developer :
// on signale seulement la nouvelle version et on ouvre la page de téléchargement.
autoUpdater.autoDownload = !MAC;
autoUpdater.autoInstallOnAppQuit = true;
const sendUpdate = (status, info) => { try { win?.webContents.send('update:status', { status, info }); } catch {} };
autoUpdater.on('checking-for-update', () => sendUpdate('checking'));
autoUpdater.on('update-available', i => sendUpdate(MAC ? 'manual' : 'available', { version: i.version }));
autoUpdater.on('update-not-available', () => sendUpdate('none'));
autoUpdater.on('download-progress', p => sendUpdate('downloading', { percent: Math.round(p.percent) }));
autoUpdater.on('update-downloaded', i => sendUpdate('downloaded', { version: i.version }));
autoUpdater.on('error', e => sendUpdate('error', { message: String(e?.message || e) }));

ipcMain.handle('update:check', async (_e, silent) => {
  if (!updatesConfigured()) return { configured: false, version: app.getVersion() };
  if (!app.isPackaged) return { configured: true, dev: true, version: app.getVersion() };
  try { await autoUpdater.checkForUpdates(); } catch (e) { sendUpdate('error', { message: String(e?.message || e) }); }
  return { configured: true, version: app.getVersion() };
});
ipcMain.handle('update:install', () => {
  if (MAC) shell.openExternal('https://github.com/Esteban-hye/Tmoney/releases/latest');
  else autoUpdater.quitAndInstall();
});
ipcMain.handle('app:version', () => app.getVersion());

// ---- Synchronisation ----
const syncCall = fn => async (...args) => {
  try { return { ok: true, data: await fn(...args) }; }
  catch (e) { return { ok: false, error: String(e?.message || e) }; }
};
ipcMain.handle('sync:signup', syncCall((_e, email, pwd) => sync.signUp(email, pwd)));
ipcMain.handle('sync:signin', syncCall((_e, email, pwd) => sync.signIn(email, pwd)));
ipcMain.handle('sync:recover', syncCall((_e, email, pwd, rk, newPwd) => sync.recover(email, pwd, rk, newPwd)));
ipcMain.handle('sync:restore', (_e, saved) => sync.restore(saved));
ipcMain.handle('sync:signout', () => { sync.signOut(); return true; });
ipcMain.handle('sync:status', () => sync.status());
ipcMain.handle('sync:setserver', (_e, cfg) => sync.setServer(cfg));
ipcMain.handle('sync:testserver', syncCall((_e, cfg) => sync.testServer(cfg)));
ipcMain.handle('app:open', (_e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });
ipcMain.handle('app:copy', (_e, text) => { clipboard.writeText(String(text)); return true; });
ipcMain.handle('sync:pull', syncCall((_e, since) => sync.pull(since)));
ipcMain.handle('sync:push', syncCall((_e, records) => sync.push(records)));
ipcMain.handle('sync:wipe', syncCall(() => sync.wipe()));

// ---- Export Excel ----
ipcMain.handle('export:xlsx', async (_e, payload) => {
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'Exporter en Excel', defaultPath: payload.filename, filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (canceled || !filePath) return false;
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Tmoney';
  for (const sh of payload.sheets) {
    const ws = wb.addWorksheet(sh.name);
    ws.columns = sh.columns.map(c => ({ header: c.header, key: c.key, width: c.width || 16, style: c.money ? { numFmt: '#,##0.00 "€"' } : c.pct ? { numFmt: '0.0%' } : {} }));
    ws.addRows(sh.rows);
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    head.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F7CF6' } }; });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  await wb.xlsx.writeFile(filePath);
  return filePath;
});

// ---- Export PDF ----
ipcMain.handle('export:pdf', async (_e, html, filename) => {
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'Exporter en PDF', defaultPath: filename, filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return false;
  const tmp = path.join(os.tmpdir(), `tmoney-report-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  const pw = new BrowserWindow({ show: false, webPreferences: { javascript: false } });
  try {
    await pw.loadFile(tmp);
    const pdf = await pw.webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } });
    fs.writeFileSync(filePath, pdf);
  } finally {
    pw.destroy();
    fs.rmSync(tmp, { force: true });
  }
  return filePath;
});
