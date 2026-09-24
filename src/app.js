'use strict';
const api = window.tmoney;

// ================= Utilitaires =================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const todayStr = () => ds(new Date());
const thisMonth = () => todayStr().slice(0, 7);
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return ds(d); };
const dayCount = (s, e) => Math.round((toDate(e) - toDate(s)) / 864e5) + 1;
const weekday = s => (toDate(s).getDay() + 6) % 7; // 0 = lundi
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eur0Fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const HIDDEN = '•••• €';
const eur = n => (D.settings.discreet ? HIDDEN : eurFmt.format(n || 0));
const eur0 = n => (D.settings.discreet ? '•• €' : eur0Fmt.format(n || 0));
const signed = n => (D.settings.discreet ? HIDDEN : (n > 0 ? '+' : '') + eurFmt.format(n || 0));
const pct = (n, d = 1) => (isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: d }) : '–') + ' %';
const parseAmount = s => { const n = Number(String(s).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; };
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WD = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const cap = s => s[0].toUpperCase() + s.slice(1);
const monthLabel = m => cap(MONTHS[+m.slice(5, 7) - 1]) + ' ' + m.slice(0, 4);
const monthShort = m => MONTHS_S[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4);
const shiftMonth = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const daysIn = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
const fmtDate = d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const fmtDM = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const sumBy = (arr, f = x => x.amount) => arr.reduce((a, x) => a + f(x), 0);
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const PALETTE = ['#2f7cf6', '#5b9dff', '#12a064', '#0e9f9a', '#8b5cf6', '#d946ef', '#e0434b', '#f97316', '#eab308', '#84cc16', '#64748b', '#0ea5e9'];

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.9 17.9A10 10 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 5.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  arrowUp: '<path d="M7 17 17 7M8 7h9v9"/>',
  arrowDown: '<path d="M17 7 7 17M16 17H7V8"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  scale: '<path d="M12 3v18M5 8h14M5 8l-3 7a3.5 3.5 0 0 0 6 0zM19 8l-3 7a3.5 3.5 0 0 0 6 0z"/>',
  piggy: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5M12 3v12"/>'
};
const ic = (n, style = '') => `<svg class="i" viewBox="0 0 24 24" ${style ? `style="${style}"` : ''}>${ICONS[n] || ''}</svg>`;
let logoN = 0; // dégradés à identifiant unique : un dégradé défini dans un élément masqué ne s'affiche pas ailleurs
const logo = () => { const a = 'lga' + (++logoN), b = 'lgb' + logoN; return `<svg viewBox="0 0 512 512" width="100%" height="100%"><defs><linearGradient id="${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9dff"/><stop offset="1" stop-color="#1d4fb8"/></linearGradient><linearGradient id="${b}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4fb8"/><stop offset="1" stop-color="#6aa8ff"/></linearGradient></defs><circle cx="256" cy="256" r="240" fill="url(#${a})"/><circle cx="256" cy="256" r="196" fill="url(#${b})"/><circle cx="256" cy="256" r="184" fill="url(#${a})"/><path d="M150 160h212v50h-80v150h-52V210h-80z" fill="#fff"/></svg>`; };
function paintIcons(root = document) {
  $$('[data-i]', root).forEach(el => { el.outerHTML = ic(el.dataset.i); });
  $$('[data-logo]', root).forEach(el => { el.innerHTML = logo(); });
}
function toast(msg, undo) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.append(msg);
  if (undo) {
    const b = document.createElement('button');
    b.textContent = 'Annuler';
    b.onclick = () => { t.remove(); undo(); };
    t.append(b);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), undo ? 8000 : 2600);
}

// ================= Données =================
const emptyData = () => ({ version: 4, settings: { theme: 'dark', discreet: false, serial: false, layout: null, opening: { amount: 0, date: '' }, autoLock: 0, u: 0 }, cats: [], tx: [], subs: [], goals: [], tomb: {}, dirty: {}, sync: null, server: null });
// Horodate un enregistrement : sert à départager les modifications entre PC (le plus récent gagne)
const SYNC_ARRAYS = { tx: 'tx', cat: 'cats', sub: 'subs', goal: 'goals' };
const markDirty = id => { if (D.dirty) D.dirty[id] = 1; };
// Toujours strictement postérieur à la version connue : une modification locale gagne même si
// l'horloge de l'autre PC avance.
const nextU = prev => Math.max(Date.now(), (prev || 0) + 1);
const stamp = o => { if (o) { o.u = nextU(o.u); markDirty(o.id); } return o; };
const stampSettings = () => { D.settings.u = nextU(D.settings.u); markDirty('settings'); };
const markDeleted = (id, kind) => {
  const prev = Object.values(SYNC_ARRAYS).map(k => D[k].find(o => o.id === id)).find(Boolean);
  D.tomb[id] = { u: nextU(prev?.u), kind };
  markDirty(id);
};
const CAT_TYPES = { out: 'Sortie', in: 'Entrée', both: 'Les deux' };

// Compatibilité avec les versions précédentes des données
function migrate(d) {
  d.settings.opening = d.settings.opening || { amount: 0, date: '' };
  d.tomb = d.tomb || {};
  d.dirty = d.dirty || {};
  if (!('sync' in d)) d.sync = null;
  if (!('server' in d)) d.server = null;
  const now = Date.now();
  for (const arr of [d.tx, d.cats, d.subs, d.goals]) for (const o of arr || []) if (!o.u) o.u = now;
  if (!d.settings.u) d.settings.u = now;
  for (const s of d.subs || []) {
    if (!s.versions || !s.versions.length) s.versions = [{ from: s.start, amount: s.amount, cat: s.cat, tag: s.tag, day: s.day, name: s.name, notes: s.notes || '', type: s.type }];
    s.versions.sort((a, b) => a.from.localeCompare(b.from));
  }
  d.version = 3;
  return d;
}
let D = emptyData();
let page = 'dashboard';

async function persist(noSync) {
  try { await api.save(D); } catch (e) { toast('Erreur de sauvegarde : ' + e.message); }
  if (!noSync && D.sync?.email) scheduleSync();
}
const cat = id => D.cats.find(c => c.id === id);
const catsOf = type => D.cats.filter(c => c.type === type || c.type === 'both').sort((a, b) => a.name.localeCompare(b.name, 'fr'));
const catName = id => cat(id)?.name || 'Sans catégorie';
const catColor = id => cat(id)?.color || '#94a3b8';
const subActiveIn = (s, m) => s.start <= m && (!s.end || s.end >= m);
// Valeurs applicables à un mois donné (une mensualité peut changer de montant en cours de route)
function subVersion(s, m) {
  let v = s.versions[0];
  for (const x of s.versions) if (x.from <= m) v = x;
  return v;
}
const subNow = s => subVersion(s, thisMonth());
function catUsage(id) {
  const used = type => D.tx.some(t => t.type === type && t.cat === id) || D.subs.some(s => s.type === type && s.versions.some(v => v.cat === id));
  return { inUse: used('in'), outUse: used('out') };
}
const signOf = t => (t.type === 'in' ? t.amount : -t.amount);

// Transactions + occurrences des mensualités entre deux dates (incluses)
function itemsIn(start, end) {
  const items = D.tx.filter(t => t.date >= start && t.date <= end);
  for (const s of D.subs) {
    let m = s.start > start.slice(0, 7) ? s.start : start.slice(0, 7);
    const last = s.end && s.end < end.slice(0, 7) ? s.end : end.slice(0, 7);
    for (; m <= last; m = shiftMonth(m, 1)) {
      const v = subVersion(s, m);
      const date = `${m}-${pad(Math.min(v.day, daysIn(m)))}`;
      if (date < start || date > end) continue;
      items.push({ id: 'sub-' + s.id + '-' + m, subId: s.id, type: v.type || s.type, amount: v.amount, cat: v.cat, tag: v.tag, tags: tagsOf(v), date, desc: v.name, notes: v.notes || '', sub: true });
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
}
const monthItems = m => itemsIn(`${m}-01`, `${m}-${daysIn(m)}`);
const firstDate = () => [...D.tx.map(t => t.date), ...D.subs.map(s => s.start + '-01')].sort()[0] || todayStr();
// Solde de départ : compté dans le solde, exclu des entrées et des statistiques
const openingAt = date => { const o = D.settings.opening || {}; return o.amount && (!o.date || o.date <= date) ? o.amount : 0; };
const balanceAt = date => openingAt(date) + sumBy(itemsIn('0000-01-01', date), signOf);

// ================= Périodes =================
function makeRange(kind, anchor) {
  if (kind === 'week') { const s = addDays(anchor, -weekday(anchor)); return { kind, start: s, end: addDays(s, 6) }; }
  if (kind === 'year') return { kind, start: `${anchor.slice(0, 4)}-01-01`, end: `${anchor.slice(0, 4)}-12-31` };
  const m = anchor.slice(0, 7);
  return { kind: 'month', start: `${m}-01`, end: `${m}-${daysIn(m)}` };
}
function shiftRange(r, n) {
  if (r.kind === 'week') return makeRange('week', addDays(r.start, 7 * n));
  if (r.kind === 'month') return makeRange('month', shiftMonth(r.start.slice(0, 7), n) + '-01');
  if (r.kind === 'year') return makeRange('year', `${+r.start.slice(0, 4) + n}-01-01`);
  const len = dayCount(r.start, r.end);
  return { kind: 'custom', start: addDays(r.start, len * n), end: addDays(r.end, len * n) };
}
function isoWeek(s) {
  const d = toDate(s); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}
function rangeLabel(r) {
  if (r.kind === 'week') return `Sem. ${isoWeek(r.start)} · ${fmtDM(r.start)} – ${fmtDate(r.end)}`;
  if (r.kind === 'month') return monthLabel(r.start);
  if (r.kind === 'year') return r.start.slice(0, 4);
  return `${fmtDate(r.start)} – ${fmtDate(r.end)}`;
}
const monthsFactor = r => (r.kind === 'month' ? 1 : r.kind === 'year' ? 12 : dayCount(r.start, r.end) / 30.4375);
function elapsedDays(r) {
  const t = todayStr();
  if (t < r.start) return 0;
  return dayCount(r.start, t > r.end ? r.end : t);
}
const PERIOD_NAMES = { week: 'semaine', month: 'mois', year: 'année', custom: 'période' };
let R = makeRange('month', todayStr());

function stats(r) {
  const items = itemsIn(r.start, r.end);
  const ins = items.filter(t => t.type === 'in'), outs = items.filter(t => t.type === 'out');
  const group = (arr, key) => { const map = new Map(); for (const t of arr) { if (t[key]) map.set(t[key], (map.get(t[key]) || 0) + t.amount); } return map; };
  const groupTags = arr => { const map = new Map(); for (const t of arr) for (const g of tagsOf(t)) map.set(g, (map.get(g) || 0) + t.amount); return map; };
  const inn = sumBy(ins), out = sumBy(outs), fixedOut = sumBy(outs.filter(t => t.sub));
  let savings = 0;
  for (const g of D.goals) for (const mv of g.moves) if (mv.date >= r.start && mv.date <= r.end) savings += mv.amount;
  return {
    r, items, ins, outs, inn, out, net: inn - out, fixedOut, varOut: out - fixedOut, savings,
    byCatOut: group(outs, 'cat'), byCatIn: group(ins, 'cat'), byTagOut: groupTags(outs)
  };
}

function ruleStatus(c, st) {
  const spent = st.byCatOut.get(c.id) || 0, f = monthsFactor(st.r);
  return (c.rules || []).map(r => {
    let ratio, label, detail;
    if (r.kind === 'budget') {
      const limit = r.value * f;
      ratio = limit ? spent / limit : 0;
      label = `Budget ${eur(r.value)} / mois${f !== 1 ? ` (${eur(limit)} sur la période)` : ''}`;
      detail = `${eur(spent)} / ${eur(limit)}`;
    } else {
      const share = st.inn ? spent / st.inn * 100 : (spent > 0 ? Infinity : 0);
      ratio = r.value ? share / r.value : 0;
      label = `Max ${pct(r.value)} des entrées`;
      detail = st.inn ? `${pct(share)} des entrées` : (spent > 0 ? 'Aucune entrée' : '0 %');
    }
    const level = ratio > 1 ? 'over' : ratio >= (r.warn ?? 80) / 100 ? 'warn' : 'ok';
    return { r, ratio, label, detail, level, spent };
  });
}

// ================= Thème & graphiques =================
function applyTheme() {
  document.documentElement.dataset.theme = D.settings.theme;
  const tb = $('#themeToggle');
  if (tb) tb.innerHTML = ic(D.settings.theme === 'dark' ? 'sun' : 'moon') + `<span>${D.settings.theme === 'dark' ? 'Thème clair' : 'Thème sombre'}</span>`;
  const dt = $('#discreetToggle');
  if (dt) dt.innerHTML = ic(D.settings.discreet ? 'eye' : 'eyeOff') + `<span>${D.settings.discreet ? 'Afficher les montants' : 'Mode discret'}</span>`;
  $$('#setTheme button').forEach(b => b.classList.toggle('on', b.dataset.v === D.settings.theme));
  $$('#setDiscreet button').forEach(b => b.classList.toggle('on', b.dataset.v === (D.settings.discreet ? 'on' : 'off')));
}
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const charts = {};
function chart(id, config) {
  if (charts[id]) charts[id].destroy();
  const el = document.getElementById(id);
  if (!el) return;
  Chart.defaults.color = css('--mut');
  Chart.defaults.borderColor = css('--bd');
  Chart.defaults.font.family = '"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif';
  charts[id] = new Chart(el, config);
}
const tooltipEur = { callbacks: { label: ctx => ` ${ctx.dataset.label ? ctx.dataset.label + ' : ' : ''}${eur(ctx.parsed.y ?? ctx.parsed)}` } };
const axisEur = () => ({ grid: { color: css('--bd') }, ticks: { callback: v => eur0(v) } });
const legendBottom = { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } };

// ================= Navigation =================
const TITLES = { dashboard: 'Tableau de bord', transactions: 'Transactions', subs: 'Mensualités', cats: 'Catégories', goals: "Objectifs d'épargne", settings: 'Réglages' };
function go(p) {
  if (editing && p !== 'dashboard') setEditing(false);
  page = p;
  $$('#nav button[data-page]').forEach(b => b.classList.toggle('on', b.dataset.page === p));
  $$('section.page').forEach(s => { s.hidden = s.id !== 'page-' + p; });
  $('#pageTitle').textContent = TITLES[p];
  $('#periodBar').hidden = !['dashboard', 'transactions', 'cats'].includes(p);
  $('#editLayout').hidden = p !== 'dashboard';
  const labels = { subs: 'Mensualité', cats: 'Catégorie', goals: 'Objectif', settings: null };
  const lbl = p in labels ? labels[p] : 'Transaction';
  $('#quickAdd').hidden = !lbl;
  if (lbl) $('#quickAdd').innerHTML = ic('plus') + lbl;
  $('#content').scrollTop = 0;
  render();
}
function renderPeriodBar() {
  $$('#periodKind button').forEach(b => b.classList.toggle('on', b.dataset.v === R.kind));
  const custom = R.kind === 'custom';
  $('#periodLabel').hidden = custom;
  $('#customRange').hidden = !custom;
  $('#periodLabel').textContent = rangeLabel(R);
  if (custom) { $('#cStart').value = R.start; $('#cEnd').value = R.end; }
}
function render() {
  renderPeriodBar();
  applyTheme();
  ({ dashboard: renderDashboard, transactions: renderTransactions, subs: renderSubs, cats: renderCats, goals: renderGoals, settings: renderSettings })[page]();
}

// ================= Tableau de bord : blocs =================
const BLOCKS = {
  kpis: { title: 'Indicateurs', span: 12 },
  bars: { title: 'Entrées et sorties sur 12 mois', span: 8 },
  cumul: { title: 'Sorties cumulées', span: 4 },
  balance: { title: 'Évolution du solde', span: 6 },
  calendar: { title: 'Calendrier des sorties', span: 6 },
  pOutCat: { title: 'Sorties par catégorie', span: 4 },
  pInCat: { title: 'Entrées par catégorie', span: 4 },
  pAlloc: { title: 'Affectation des entrées', span: 4 },
  pFixVar: { title: 'Sorties fixes / variables', span: 4 },
  pInOut: { title: 'Entrées / sorties', span: 4 },
  pTags: { title: 'Sorties par étiquette', span: 4 },
  stats: { title: 'Statistiques', span: 12 },
  weekday: { title: 'Sorties par jour de la semaine', span: 8 },
  rules: { title: 'Règles', span: 4 },
  evo: { title: 'Évolution par catégorie', span: 12 },
  compare: { title: 'Comparaison de deux mois', span: 12 },
  lastIn: { title: 'Dernières entrées', span: 6 },
  lastOut: { title: 'Dernières sorties', span: 6 }
};
// Graphiques personnalisés (D.settings.charts) : { id, title, type, sense, src, span, items: [id catégorie] }
const CHART_TYPES = { pie: 'Camembert (période affichée)', hbar: 'Barres (période affichée)', bars12: 'Barres sur 12 mois', line12: 'Courbes sur 12 mois' };
const CHART_SRC = { both: 'Catégorie ou étiquette', cat: 'Catégorie principale seulement', tag: 'Étiquettes seulement' };
const CHART_SPANS = { 4: 'Petit (1/3)', 6: 'Moyen (1/2)', 8: 'Grand (2/3)', 12: 'Pleine largeur' };
const customCharts = () => D.settings.charts || [];
const blockDef = id => BLOCKS[id] || (c => c && { title: esc(c.title), span: c.span, custom: c })(customCharts().find(c => c.id === id));
const allBlockIds = () => [...Object.keys(BLOCKS), ...customCharts().map(c => c.id)];
const defaultLayout = () => allBlockIds().map(id => ({ id, hidden: false }));
function layout() {
  const saved = (D.settings.layout || []).filter(b => blockDef(b.id));
  for (const id of allBlockIds()) if (!saved.some(b => b.id === id)) saved.push({ id, hidden: false });
  return saved;
}
let editing = false;
let cmpA = null, cmpB = null;

const cardHtml = (title, sub, body) => `<div class="card"><h3>${title}${sub ? `<span class="mut">${sub}</span>` : ''}</h3>${body}</div>`;
const emptyHtml = txt => `<div class="empty">${txt}</div>`;
const mapEntries = map => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ id: k, label: catName(k), value: v, color: catColor(k) }));

function deltaHtml(cur, prev, goodWhenUp) {
  if (!prev) return '<span>Période précédente : –</span>';
  const d = (cur - prev) / prev * 100, good = goodWhenUp ? d >= 0 : d <= 0;
  return `<span class="delta" style="color:var(${good ? '--in' : '--out'})">${d >= 0 ? '+' : ''}${pct(d, 0)}</span> vs ${PERIOD_NAMES[R.kind]} préc.`;
}

function pieBlock(id, sub, entries, centerLabel, after, title = BLOCKS[id]?.title) {
  const total = sumBy(entries, e => e.value);
  const body = total > 0
    ? `<div class="pie"><div class="ring"><canvas id="ch-${id}"></canvas><div class="center"><div><b>${eur0(total)}</b><span>${centerLabel}</span></div></div></div>
       <div class="legend">${entries.map(e => `<div class="li ${e.id ? 'clickable' : ''}" ${e.id && cat(e.id) ? `data-cat-detail="${e.id}"` : ''}><i class="dot" style="background:${e.color}"></i><span class="n" title="${esc(e.label)}">${esc(e.label)}</span><span class="num">${eur(e.value)}</span><span class="p">${pct(e.value / total * 100)}</span></div>`).join('')}</div></div>`
    : emptyHtml('Aucune donnée');
  after.push(() => {
    if (!total) return;
    chart('ch-' + id, {
      type: 'doughnut',
      data: { labels: entries.map(e => e.label), datasets: [{ data: entries.map(e => e.value), backgroundColor: entries.map(e => e.color), borderColor: css('--card'), borderWidth: 2, hoverOffset: 6 }] },
      options: { maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label} : ${eur(c.parsed)} (${pct(c.parsed / total * 100)})` } } } }
    });
  });
  return cardHtml(title, sub, body);
}

function customBlock(c, st, after) {
  const ids = (c.items || []).filter(id => cat(id));
  const title = esc(c.title), cid = 'ch-' + c.id;
  if (!ids.length) return cardHtml(title, '', emptyHtml('Aucune catégorie choisie : cliquer sur « Personnaliser » puis sur le crayon'));
  const match = (t, id) => t.type === c.sense && ((c.src !== 'tag' && t.cat === id) || (c.src !== 'cat' && tagsOf(t).includes(id)));
  const senseLbl = c.sense === 'in' ? 'entrées' : 'sorties';
  if (c.type === 'pie' || c.type === 'hbar') {
    const entries = ids.map(id => ({ id, label: catName(id), value: sumBy(st.items.filter(t => match(t, id))), color: catColor(id) }))
      .filter(e => e.value > 0).sort((a, b) => b.value - a.value);
    if (c.type === 'pie') return pieBlock(c.id, senseLbl, entries, senseLbl, after, title);
    if (!entries.length) return cardHtml(title, senseLbl, emptyHtml('Aucune donnée'));
    after.push(() => chart(cid, {
      type: 'bar',
      data: { labels: entries.map(e => e.label), datasets: [{ data: entries.map(e => e.value), backgroundColor: entries.map(e => e.color), borderRadius: 5, maxBarThickness: 26 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => ` ${eur(x.parsed.x)}` } } }, scales: { x: axisEur(), y: { grid: { display: false } } } }
    }));
    return cardHtml(title, senseLbl, `<div class="chart-box" style="height:${Math.max(160, 44 * entries.length + 40)}px"><canvas id="${cid}"></canvas></div>`);
  }
  const endM = R.end.slice(0, 7), months = [...Array(12)].map((_, i) => shiftMonth(endM, i - 11));
  const perMonth = months.map(monthItems);
  const line = c.type === 'line12';
  after.push(() => chart(cid, {
    type: line ? 'line' : 'bar',
    data: {
      labels: months.map(monthShort),
      datasets: ids.map(id => ({
        label: catName(id), data: perMonth.map(it => sumBy(it.filter(t => match(t, id)))),
        borderColor: catColor(id), backgroundColor: catColor(id),
        ...(line ? { tension: .3, pointRadius: 3, borderWidth: 2 } : { borderRadius: 4, maxBarThickness: 18 })
      }))
    },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: legendBottom, tooltip: tooltipEur }, scales: { x: { grid: { display: false } }, y: axisEur() } }
  }));
  return cardHtml(title, `${senseLbl} · jusqu'à ${monthLabel(endM).toLowerCase()}`, `<div class="chart-box"><canvas id="${cid}"></canvas></div>`);
}

function chartModal(existing) {
  const c = existing || { title: '', type: 'pie', sense: 'out', src: 'both', span: 4, items: [] };
  const opts = (map, cur) => Object.entries(map).map(([v, l]) => `<option value="${v}" ${String(cur) === v ? 'selected' : ''}>${l}</option>`).join('');
  modal({
    title: existing ? 'Modifier le graphique' : 'Nouveau graphique',
    submit: existing ? 'Enregistrer' : 'Ajouter',
    body: `<label class="f">Titre<input name="title" value="${esc(c.title)}" placeholder="ex. Sorties loisirs"></label>
      <div class="row"><label class="f">Type<select name="type">${opts(CHART_TYPES, c.type)}</select></label>
        <label class="f">Taille<select name="span">${opts(CHART_SPANS, c.span)}</select></label></div>
      <div class="row"><label class="f">Montants<select name="sense">${opts({ out: 'Sorties', in: 'Entrées' }, c.sense)}</select></label>
        <label class="f">Compter une transaction si c'est sa…<select name="src">${opts(CHART_SRC, c.src)}</select></label></div>
      ${catChips('items', c.items, 'Catégories et étiquettes à afficher')}`,
    onSubmit: form => {
      const items = Array.from(form.querySelectorAll('input[name="items"]:checked'), i => i.value);
      if (!items.length) return 'Choisir au moins une catégorie ou étiquette.';
      const data = { title: form.title.value.trim() || 'Graphique', type: form.type.value, span: +form.span.value, sense: form.sense.value, src: form.src.value, items };
      if (existing) Object.assign(existing, data);
      else {
        const id = 'cc-' + uid();
        D.settings.charts = [...customCharts(), { id, ...data }];
        const L = layout().filter(b => b.id !== id);
        L.splice(L.findIndex(b => b.id === 'kpis') + 1, 0, { id, hidden: false }); // juste sous les indicateurs
        D.settings.layout = L;
      }
      stampSettings(); persist(); renderDashboard();
      toast(existing ? 'Graphique modifié' : 'Graphique ajouté');
    }
  });
}

function renderDashboard() {
  const st = stats(R), prev = stats(shiftRange(R, -1));
  const today = todayStr(), nbDays = elapsedDays(R), totalDays = dayCount(R.start, R.end);
  const after = [];
  const acc = css('--acc'), save = css('--save'), mut = css('--mut'), outC = css('--out'), inC = css('--in');
  const B = {};

  B.kpis = () => {
    const balDate = today < R.end ? (today < R.start ? addDays(R.start, -1) : today) : R.end;
    const bal = balanceAt(balDate), balEnd = balanceAt(R.end);
    const tile = (cls, icon, iconStyle, label, val, valCls, sub) =>
      `<div class="card kpi ${cls}"><div class="lbl"><span class="ico" style="${iconStyle}">${ic(icon)}</span>${label}</div><div class="val ${valCls}">${val}</div><div class="sub">${sub}</div></div>`;
    return `<div class="kpi-row">
      ${tile('main', 'wallet', '', 'Solde', eur(bal), '', `Au ${fmtDate(balDate)}${R.end > today && R.start <= today ? ` · Fin de ${PERIOD_NAMES[R.kind]} prévue : ${eur(balEnd)}` : ''}`)}
      ${tile('', 'arrowDown', 'background:color-mix(in srgb,var(--in) 15%,transparent);color:var(--in)', 'Entrées', eur(st.inn), 'in', deltaHtml(st.inn, prev.inn, true))}
      ${tile('', 'arrowUp', 'background:color-mix(in srgb,var(--out) 15%,transparent);color:var(--out)', 'Sorties', eur(st.out), 'out', deltaHtml(st.out, prev.out, false))}
      ${tile('', 'scale', 'background:var(--acc-soft);color:var(--acc)', 'Résultat', signed(st.net), st.net >= 0 ? 'in' : 'out', st.inn ? `Sorties / entrées : ${pct(st.out / st.inn * 100, 0)}` : 'Aucune entrée')}
      ${tile('', 'piggy', 'background:color-mix(in srgb,var(--save) 15%,transparent);color:var(--save)', "Taux d'épargne", pct(st.inn ? st.savings / st.inn * 100 : 0), '', `Épargne : ${eur(st.savings)}`)}
    </div>`;
  };

  B.bars = () => {
    const endM = R.end.slice(0, 7), months = [...Array(12)].map((_, i) => shiftMonth(endM, i - 11));
    const ms = months.map(m => { const it = monthItems(m); return { in: sumBy(it.filter(t => t.type === 'in')), out: sumBy(it.filter(t => t.type === 'out')) }; });
    after.push(() => chart('ch-bars', {
      type: 'bar',
      data: {
        labels: months.map(monthShort),
        datasets: [
          { label: 'Entrées', data: ms.map(s => s.in), backgroundColor: inC, borderRadius: 5, maxBarThickness: 22 },
          { label: 'Sorties', data: ms.map(s => s.out), backgroundColor: outC, borderRadius: 5, maxBarThickness: 22 },
          { type: 'line', label: 'Résultat', data: ms.map(s => s.in - s.out), borderColor: acc, backgroundColor: acc, tension: .35, pointRadius: 3, borderWidth: 2 }
        ]
      },
      options: { maintainAspectRatio: false, plugins: { legend: legendBottom, tooltip: tooltipEur }, scales: { x: { grid: { display: false } }, y: axisEur() } }
    }));
    return cardHtml(BLOCKS.bars.title, `jusqu'à ${monthLabel(endM).toLowerCase()}`, '<div class="chart-box"><canvas id="ch-bars"></canvas></div>');
  };

  B.cumul = () => {
    const pr = shiftRange(R, -1), len = Math.max(totalDays, dayCount(pr.start, pr.end));
    const cumul = (items, start) => { const d = Array(len).fill(0); items.filter(t => t.type === 'out').forEach(t => { const i = dayCount(start, t.date) - 1; if (i >= 0 && i < len) d[i] += t.amount; }); let c = 0; return d.map(v => (c += v)); };
    const cur = cumul(st.items, R.start), old = cumul(prev.items, pr.start);
    after.push(() => chart('ch-cumul', {
      type: 'line',
      data: {
        labels: [...Array(len)].map((_, i) => (R.kind === 'month' ? i + 1 : fmtDM(addDays(R.start, i)))),
        datasets: [
          { label: 'Période', data: cur.map((v, i) => (i < nbDays ? v : null)), borderColor: acc, backgroundColor: css('--acc-soft'), fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 },
          { label: 'Période préc.', data: old.slice(0, dayCount(pr.start, pr.end)), borderColor: mut, borderDash: [5, 5], tension: .3, pointRadius: 0, borderWidth: 1.5 }
        ]
      },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: legendBottom, tooltip: tooltipEur }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: axisEur() } }
    }));
    return cardHtml(BLOCKS.cumul.title, `vs ${PERIOD_NAMES[R.kind]} préc.`, '<div class="chart-box"><canvas id="ch-cumul"></canvas></div>');
  };

  B.balance = () => {
    let b = balanceAt(addDays(R.start, -1));
    const daily = Array(totalDays).fill(0);
    st.items.forEach(t => { daily[dayCount(R.start, t.date) - 1] += signOf(t); });
    // Solde de départ daté dans la période : il s'ajoute ce jour-là (avant, balanceAt ne le compte pas encore).
    const o = D.settings.opening || {};
    if (o.amount && o.date >= R.start && o.date <= R.end) daily[dayCount(R.start, o.date) - 1] += o.amount;
    const vals = daily.map(v => (b += v));
    const cut = today < R.start ? -1 : today > R.end ? totalDays - 1 : dayCount(R.start, today) - 1;
    after.push(() => chart('ch-balance', {
      type: 'line',
      data: {
        labels: vals.map((_, i) => fmtDM(addDays(R.start, i))),
        datasets: [
          { label: 'Solde', data: vals.map((v, i) => (i <= cut ? v : null)), borderColor: acc, backgroundColor: css('--acc-soft'), fill: true, tension: .25, pointRadius: 0, borderWidth: 2.5 },
          { label: 'Prévision', data: vals.map((v, i) => (i >= cut ? v : null)), borderColor: acc, borderDash: [5, 5], tension: .25, pointRadius: 0, borderWidth: 1.5 }
        ]
      },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: legendBottom, tooltip: { callbacks: { label: c => (c.parsed.y == null ? null : ` ${c.dataset.label} : ${eur(c.parsed.y)}`) } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: axisEur() } }
    }));
    return cardHtml(BLOCKS.balance.title, 'report compris', '<div class="chart-box"><canvas id="ch-balance"></canvas></div>');
  };

  B.calendar = () => {
    const perDay = new Map();
    st.outs.forEach(t => perDay.set(t.date, (perDay.get(t.date) || 0) + t.amount));
    const max = Math.max(0, ...perDay.values());
    const color = v => (v > 0 && max ? `background:color-mix(in srgb, var(--out) ${Math.round(18 + 82 * v / max)}%, var(--card-2))` : '');
    const days = [...Array(totalDays)].map((_, i) => addDays(R.start, i));
    let body;
    if (totalDays <= 62) {
      body = `<div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="wd">${d}</div>`).join('')}
        ${'<div></div>'.repeat(weekday(R.start))}
        ${days.map(d => { const v = perDay.get(d) || 0; return `<div class="d ${d === today ? 'today' : ''} ${max && v / max > .45 ? 'hot' : ''}" style="${color(v)}" title="${fmtDate(d)} : ${eur(v)}"><b>${+d.slice(8)}</b><span>${v ? eur0(v) : ''}</span></div>`; }).join('')}</div>`;
    } else {
      body = `<div class="heat-wrap"><div class="heat-days">${['L', '', 'M', '', 'V', '', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="heat">${'<i style="visibility:hidden"></i>'.repeat(weekday(R.start))}${days.map(d => { const v = perDay.get(d) || 0; return `<i style="${color(v)}" title="${fmtDate(d)} : ${eur(v)}"></i>`; }).join('')}</div></div>`;
    }
    const scale = `<div class="scale">Faible ${[18, 45, 72, 100].map(p => `<i style="background:color-mix(in srgb, var(--out) ${p}%, var(--card-2))"></i>`).join('')} Élevé</div>`;
    return cardHtml(BLOCKS.calendar.title, max ? `max ${eur(max)} / jour` : '', body + scale);
  };

  const rest = Math.max(0, st.inn - st.out - st.savings);
  B.pOutCat = () => pieBlock('pOutCat', '', mapEntries(st.byCatOut), 'sorties', after);
  B.pInCat = () => pieBlock('pInCat', '', mapEntries(st.byCatIn), 'entrées', after);
  B.pAlloc = () => pieBlock('pAlloc', 'base : entrées', st.inn ? [
    { label: 'Sorties fixes', value: Math.min(st.fixedOut, st.inn), color: acc },
    { label: 'Sorties variables', value: Math.min(st.varOut, Math.max(0, st.inn - st.fixedOut)), color: '#8bb6ff' },
    { label: 'Épargne', value: Math.max(0, Math.min(st.savings, Math.max(0, st.inn - st.out))), color: save },
    { label: 'Disponible', value: rest, color: mut }
  ].filter(e => e.value > 0) : [], 'entrées', after);
  B.pFixVar = () => pieBlock('pFixVar', '', [
    { label: 'Fixes (mensualités)', value: st.fixedOut, color: acc },
    { label: 'Variables', value: st.varOut, color: '#8bb6ff' }
  ].filter(e => e.value > 0), 'sorties', after);
  B.pInOut = () => pieBlock('pInOut', '', [
    { label: 'Entrées', value: st.inn, color: inC },
    { label: 'Sorties', value: st.out, color: outC }
  ].filter(e => e.value > 0), 'total', after);
  B.pTags = () => pieBlock('pTags', '', mapEntries(st.byTagOut), 'étiquetés', after);

  B.stats = () => {
    const biggest = st.outs.reduce((a, t) => (!a || t.amount > a.amount ? t : a), null);
    const topCat = mapEntries(st.byCatOut)[0], topIn = mapEntries(st.byCatIn)[0];
    const elapsedEnd = nbDays ? addDays(R.start, nbDays - 1) : null;
    const daysWithOut = new Set(st.outs.filter(t => elapsedEnd && t.date <= elapsedEnd).map(t => t.date)).size;
    const inProgress = today >= R.start && today <= R.end;
    const projected = inProgress && nbDays ? st.outs.filter(t => !t.sub && t.date <= today).reduce((a, t) => a + t.amount, 0) / nbDays * totalDays + st.fixedOut : st.out;
    const tiles = [
      ['Moyenne / jour', eur(nbDays ? st.outs.filter(t => t.date <= (elapsedEnd || '')).reduce((a, t) => a + t.amount, 0) / nbDays : 0), plural(nbDays, 'jour')],
      ['Plus grosse sortie', biggest ? eur(biggest.amount) : '–', biggest ? `${biggest.desc || catName(biggest.cat)} · ${fmtDM(biggest.date)}` : '–'],
      ['Top catégorie sorties', topCat ? topCat.label : '–', topCat ? `${eur(topCat.value)} · ${pct(topCat.value / st.out * 100)}` : '–'],
      ['Top catégorie entrées', topIn ? topIn.label : '–', topIn ? `${eur(topIn.value)} · ${pct(topIn.value / st.inn * 100)}` : '–'],
      ['Part des mensualités', pct(st.inn ? st.fixedOut / st.inn * 100 : 0), `${eur(st.fixedOut)} / entrées`],
      ['Jours sans sortie', String(Math.max(0, nbDays - daysWithOut)), `sur ${plural(nbDays, 'jour')}`],
      ['Transactions', String(st.items.length), `${plural(st.ins.length, 'entrée')} · ${plural(st.outs.length, 'sortie')}`],
      ['Sortie moyenne', eur(st.outs.length ? st.out / st.outs.length : 0), 'par transaction'],
      [inProgress ? 'Projection sorties' : 'Sorties totales', eur(projected), inProgress ? `fin de ${PERIOD_NAMES[R.kind]}, rythme actuel` : 'période terminée'],
      ['Épargne', eur(st.savings), `${pct(st.inn ? st.savings / st.inn * 100 : 0)} des entrées`],
      ['Solde début de période', eur(balanceAt(addDays(R.start, -1))), `au ${fmtDate(addDays(R.start, -1))}`],
      ['Disponible après épargne', signed(st.net - st.savings), 'résultat − épargne']
    ];
    return `<div class="stats-grid">${tiles.map(([l, v, s]) => `<div class="card stat"><div class="lbl">${l}</div><div class="val">${esc(v)}</div><div class="sub">${esc(s)}</div></div>`).join('')}</div>`;
  };

  B.weekday = () => {
    const tot = Array(7).fill(0), cnt = Array(7).fill(0);
    st.outs.forEach(t => { tot[weekday(t.date)] += t.amount; });
    for (let i = 0; i < totalDays; i++) cnt[weekday(addDays(R.start, i))]++;
    const avg = tot.map((v, i) => (cnt[i] ? v / cnt[i] : 0));
    const top = tot.indexOf(Math.max(...tot));
    after.push(() => chart('ch-weekday', {
      type: 'bar',
      data: { labels: WD, datasets: [
        { label: 'Total', data: tot, backgroundColor: tot.map((_, i) => (i === top && tot[i] ? outC : acc)), borderRadius: 6, maxBarThickness: 46 },
        { type: 'line', label: 'Moyenne par jour', data: avg, borderColor: mut, backgroundColor: mut, pointRadius: 3, borderWidth: 1.5, tension: .3 }
      ] },
      options: { maintainAspectRatio: false, plugins: { legend: legendBottom, tooltip: tooltipEur }, scales: { x: { grid: { display: false } }, y: axisEur() } }
    }));
    return cardHtml(BLOCKS.weekday.title, st.out ? `pic : ${WD[top].toLowerCase()} (${pct(tot[top] / st.out * 100, 0)})` : '', '<div class="chart-box"><canvas id="ch-weekday"></canvas></div>');
  };

  B.rules = () => {
    const list = catsOf('out').flatMap(c => ruleStatus(c, st).map(rs => ({ c, ...rs }))).sort((a, b) => b.ratio - a.ratio);
    return cardHtml(BLOCKS.rules.title, '', list.length
      ? list.map(a => `<div class="rule"><div class="top"><span class="clickable" data-cat-detail="${a.c.id}">${catTag(a.c.id)} <span class="mut">${a.label}</span></span><span>${a.detail}</span></div><div class="prog ${a.level}"><i style="width:${Math.min(100, a.ratio * 100)}%"></i></div></div>`).join('')
      : emptyHtml('Aucune règle. Catégories → Modifier → Ajouter une règle.'));
  };

  B.evo = () => {
    const ids = new Set([...st.byCatOut.keys(), ...prev.byCatOut.keys()]);
    const evo = [...ids].map(id => ({ id, cur: st.byCatOut.get(id) || 0, prev: prev.byCatOut.get(id) || 0 })).sort((a, b) => b.cur - a.cur);
    const body = evo.length
      ? `<div class="table-wrap"><table><thead><tr><th>Catégorie</th><th class="r">Période préc.</th><th class="r">Période</th><th class="r">Écart</th><th class="r">Part</th></tr></thead><tbody>` +
        evo.map(e => { const diff = e.cur - e.prev, dp = e.prev ? diff / e.prev * 100 : null;
          return `<tr class="clickable" data-cat-detail="${e.id}"><td>${catTag(e.id)}</td><td class="r num mut">${eur(e.prev)}</td><td class="r num">${eur(e.cur)}</td>
            <td class="r num" style="color:var(${diff > 0 ? '--out' : diff < 0 ? '--in' : '--mut'})">${signed(diff)}${dp !== null ? ` <small>(${diff > 0 ? '+' : ''}${pct(dp, 0)})</small>` : ''}</td>
            <td class="r num mut">${st.out ? pct(e.cur / st.out * 100) : '–'}</td></tr>`; }).join('') + '</tbody></table></div>'
      : emptyHtml('Aucune sortie');
    return cardHtml(BLOCKS.evo.title, `vs ${PERIOD_NAMES[R.kind]} préc.`, body);
  };

  B.compare = () => {
    const endM = R.end.slice(0, 7);
    const latest = [thisMonth(), endM].sort().pop();
    const opts = [...Array(36)].map((_, i) => shiftMonth(latest, -i));
    const a = cmpA || endM, b = cmpB || shiftMonth(endM, -1);
    const ia = monthItems(a), ib = monthItems(b);
    const grp = (items, type) => { const m = new Map(); items.filter(t => t.type === type).forEach(t => m.set(t.cat, (m.get(t.cat) || 0) + t.amount)); return m; };
    const oa = grp(ia, 'out'), ob = grp(ib, 'out');
    const ids = [...new Set([...oa.keys(), ...ob.keys()])].sort((x, y) => (oa.get(y) || 0) + (ob.get(y) || 0) - (oa.get(x) || 0) - (ob.get(x) || 0));
    const sel = (id, v) => `<select id="${id}">${opts.map(m => `<option value="${m}" ${m === v ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}</select>`;
    const tIn = x => sumBy(x.filter(t => t.type === 'in')), tOut = x => sumBy(x.filter(t => t.type === 'out'));
    const rows = [['Entrées', tIn(ia), tIn(ib), true], ['Sorties', tOut(ia), tOut(ib), false], ...ids.map(id => [catTag(id), oa.get(id) || 0, ob.get(id) || 0, false, id])];
    after.push(() => chart('ch-compare', {
      type: 'bar',
      data: { labels: ids.slice(0, 10).map(catName), datasets: [
        { label: monthLabel(a), data: ids.slice(0, 10).map(id => oa.get(id) || 0), backgroundColor: acc, borderRadius: 4 },
        { label: monthLabel(b), data: ids.slice(0, 10).map(id => ob.get(id) || 0), backgroundColor: '#8bb6ff', borderRadius: 4 }
      ] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: legendBottom, tooltip: { callbacks: { label: c => ` ${c.dataset.label} : ${eur(c.parsed.x)}` } } }, scales: { x: axisEur(), y: { grid: { display: false } } } }
    }));
    return cardHtml(BLOCKS.compare.title, '', `<div class="cmp-head">${sel('cmpA', a)}<span class="mut">vs</span>${sel('cmpB', b)}</div>
      <div class="grid g2"><div class="chart-box" style="height:${Math.max(220, ids.slice(0, 10).length * 34 + 60)}px"><canvas id="ch-compare"></canvas></div>
      <div class="table-wrap"><table><thead><tr><th></th><th class="r">${esc(monthShort(a))}</th><th class="r">${esc(monthShort(b))}</th><th class="r">Écart</th></tr></thead><tbody>
      ${rows.map(([l, va, vb, up, id], i) => { const d = va - vb, good = up ? d >= 0 : d <= 0;
        return `<tr ${id ? `class="clickable" data-cat-detail="${id}"` : ''} ${i === 1 ? 'style="border-bottom:2px solid var(--bd)"' : ''}><td>${i < 2 ? `<b>${l}</b>` : l}</td><td class="r num">${eur(va)}</td><td class="r num mut">${eur(vb)}</td>
          <td class="r num" style="color:var(${d === 0 ? '--mut' : good ? '--in' : '--out'})">${signed(d)}${vb ? ` <small>(${d >= 0 ? '+' : ''}${pct(d / vb * 100, 0)})</small>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div></div>`);
  };

  const mini = (arr, type) => arr.length
    ? '<div class="table-wrap"><table><tbody>' + arr.slice(0, 6).map(t => `<tr><td class="mut num" style="width:60px">${fmtDM(t.date)}</td><td class="cell-desc"><b>${esc(t.desc) || esc(catName(t.cat))}</b></td><td>${catTag(t.cat)}</td><td class="r num ${type}">${type === 'in' ? '+' : '−'}${eur(t.amount)}</td></tr>`).join('') + '</tbody></table></div>'
    : emptyHtml('Aucune donnée');
  B.lastIn = () => cardHtml(BLOCKS.lastIn.title, '', mini(st.ins, 'in'));
  B.lastOut = () => cardHtml(BLOCKS.lastOut.title, '', mini(st.outs, 'out'));

  const L = layout();
  $('#dashGrid').classList.toggle('editing', editing);
  $('#editBanner').hidden = !editing;
  $('#dashGrid').innerHTML = L.filter(b => editing || !b.hidden).map(b => {
    const def = blockDef(b.id);
    const inner = b.hidden ? `<div class="card off-card">${def.title}</div>` : def.custom ? customBlock(def.custom, st, after) : B[b.id]();
    const own = def.custom ? `<button data-edit-chart="${b.id}" title="Modifier">${ic('edit')}</button><button data-del-chart="${b.id}" title="Supprimer">${ic('trash')}</button>` : '';
    const bar = editing ? `<div class="edit-bar">${ic('grip')}${def.title}${own}<button data-toggle-block="${b.id}" title="${b.hidden ? 'Afficher' : 'Masquer'}">${ic(b.hidden ? 'eyeOff' : 'eye')}</button></div>` : '';
    return `<div class="block span-${def.span} ${b.hidden ? 'off' : ''}" data-block="${b.id}" ${editing ? 'draggable="true"' : ''}>${bar}${inner}</div>`;
  }).join('');
  after.forEach(f => f());
  $('#cmpA')?.addEventListener('change', e => { cmpA = e.target.value; renderDashboard(); });
  $('#cmpB')?.addEventListener('change', e => { cmpB = e.target.value; renderDashboard(); });
}

function setEditing(on) {
  editing = on;
  $('#editLayout').innerHTML = ic('layout') + (on ? 'Terminer' : 'Personnaliser');
  if (page === 'dashboard') renderDashboard();
}
function bindLayoutDnd() {
  const grid = $('#dashGrid');
  let dragId = null;
  const clear = () => $$('.block', grid).forEach(b => b.classList.remove('drop-before', 'drop-after', 'dragging'));
  grid.addEventListener('dragstart', e => {
    const b = e.target.closest('.block'); if (!editing || !b) return;
    dragId = b.dataset.block; b.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });
  grid.addEventListener('dragover', e => {
    const b = e.target.closest('.block'); if (!editing || !dragId || !b) return;
    e.preventDefault();
    const rect = b.getBoundingClientRect(), before = e.clientX < rect.left + rect.width / 2;
    $$('.block', grid).forEach(x => x.classList.remove('drop-before', 'drop-after'));
    if (b.dataset.block !== dragId) b.classList.add(before ? 'drop-before' : 'drop-after');
  });
  grid.addEventListener('drop', e => {
    const b = e.target.closest('.block'); if (!editing || !dragId || !b) return;
    e.preventDefault();
    const target = b.dataset.block, before = b.classList.contains('drop-before');
    clear();
    if (target === dragId) return;
    const L = layout(), item = L.splice(L.findIndex(x => x.id === dragId), 1)[0];
    L.splice(L.findIndex(x => x.id === target) + (before ? 0 : 1), 0, item);
    D.settings.layout = L; dragId = null;
    stampSettings(); persist(); renderDashboard();
  });
  grid.addEventListener('dragend', () => { dragId = null; clear(); });
}

// Étiquettes multiples : "tags" = liste, "tag" = première étiquette (lue par les versions ≤ 0.7).
// Si "tag" ne correspond plus à tags[0], c'est qu'une ancienne version a modifié l'élément : on suit "tag".
const tagsOf = x => Array.isArray(x.tags) && (x.tags[0] || '') === (x.tag || '') ? x.tags : x.tag ? [x.tag] : [];
const withTags = tags => ({ tags, tag: tags[0] || '' });
const tagNames = x => tagsOf(x).map(catName).join(', ');
const catTag = (id, dashed) => `<span class="tag ${dashed ? 'lbl' : ''}"><i class="dot" style="background:${catColor(id)}"></i>${esc(catName(id))}</span>`;

// ================= Transactions =================
let txType = 'all';
function renderTransactions() {
  const sel = $('#txFilterCat'), prevVal = sel.value;
  sel.innerHTML = '<option value="">Toutes catégories</option>' +
    ['out', 'in'].map(t => catsOf(t).length ? `<optgroup label="${t === 'out' ? 'Sorties' : 'Entrées'}">${catsOf(t).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</optgroup>` : '').join('');
  sel.value = prevVal;
  const all = $('#txScope').value === 'all';
  const q = $('#txSearch').value.trim().toLowerCase(), qNum = parseAmount(q), fc = sel.value;
  const source = all ? itemsIn('0000-01-01', [todayStr(), ...D.tx.map(t => t.date)].sort().pop()) : itemsIn(R.start, R.end);
  const list = source.filter(t =>
    (txType === 'all' || t.type === txType) &&
    (!fc || t.cat === fc || tagsOf(t).includes(fc)) &&
    (!q || [t.desc, t.notes, catName(t.cat), tagNames(t)].some(s => (s || '').toLowerCase().includes(q)) || (isFinite(qNum) && qNum > 0 && Math.abs(t.amount - qNum) < 0.005)));
  const inn = sumBy(list.filter(t => t.type === 'in')), out = sumBy(list.filter(t => t.type === 'out'));
  $('#txTotals').innerHTML = `<span>Entrées <b class="in">${eur(inn)}</b></span><span>Sorties <b class="out">${eur(out)}</b></span><span>${plural(list.length, 'ligne')}</span>`;
  const shown = list.slice(0, 1000);
  $('#txTable').innerHTML = list.length
    ? `<thead><tr><th style="width:100px">Date</th><th>Description</th><th>Catégorie</th><th>Étiquettes</th><th class="r">Montant</th><th style="width:90px"></th></tr></thead><tbody>` +
      shown.map(t => `<tr>
        <td class="num mut">${fmtDate(t.date)}</td>
        <td class="cell-desc"><b>${esc(t.desc) || '<span class="mut">–</span>'}</b> ${t.sub ? '<span class="badge">Mensualité</span>' : ''}${t.notes ? `<small title="${esc(t.notes)}">${esc(t.notes)}</small>` : ''}</td>
        <td><span class="clickable" data-cat-detail="${t.cat}">${catTag(t.cat)}</span></td>
        <td>${tagsOf(t).length ? `<div class="tags">${tagsOf(t).map(g => `<span class="clickable" data-cat-detail="${g}">${catTag(g, true)}</span>`).join('')}</div>` : '<span class="mut">–</span>'}</td>
        <td class="r num ${t.type}" style="font-weight:600">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</td>
        <td class="r">${t.sub
          ? `<button class="icon-btn" title="Modifier la mensualité" data-edit-sub="${t.subId}">${ic('edit')}</button>`
          : `<button class="icon-btn" title="Modifier" data-edit-tx="${t.id}">${ic('edit')}</button><button class="icon-btn del" title="Supprimer" data-del-tx="${t.id}">${ic('trash')}</button>`}</td>
      </tr>`).join('') + (list.length > shown.length ? `<tr><td colspan="6" class="empty">${list.length - shown.length} lignes supplémentaires : affiner la recherche.</td></tr>` : '') + '</tbody>'
    : `<tr><td class="empty">Aucun résultat</td></tr>`;
}

// ================= Mensualités =================
function renderSubs() {
  const m = thisMonth(), st = stats(makeRange('month', todayStr()));
  const amountOf = s => subVersion(s, m).amount;
  const active = D.subs.filter(s => subActiveIn(s, m));
  const aOut = active.filter(s => s.type === 'out'), aIn = active.filter(s => s.type === 'in');
  const outT = sumBy(aOut, amountOf), inT = sumBy(aIn, amountOf);
  $('#subKpis').innerHTML = [
    ['Sorties fixes / mois', eur(outT), plural(aOut.length, 'active'), 'out'],
    ['Sorties fixes / an', eur(outT * 12), 'projection', ''],
    ['Entrées fixes / mois', eur(inT), plural(aIn.length, 'active'), 'in'],
    ['Part des entrées', pct(st.inn ? outT / st.inn * 100 : 0), monthLabel(m), '']
  ].map(([l, v, sub, c]) => `<div class="card kpi"><div class="lbl">${l}</div><div class="val ${c}">${v}</div><div class="sub">${sub}</div></div>`).join('');
  const table = type => {
    const list = D.subs.filter(s => s.type === type).sort((a, b) => amountOf(b) - amountOf(a));
    if (!list.length) return `<tr><td class="empty">Aucune mensualité</td></tr>`;
    const tot = sumBy(list.filter(s => subActiveIn(s, m)), amountOf);
    return `<thead><tr><th>Nom</th><th>Catégorie</th><th>Étiquettes</th><th>Jour</th><th>Statut</th><th class="r">Montant</th><th class="r">Par an</th><th class="r">Part</th><th style="width:120px"></th></tr></thead><tbody>` +
      list.map(s => {
        const v = subVersion(s, m), on = subActiveIn(s, m);
        const status = !on && s.start > m ? `<span class="badge grey">Début ${monthShort(s.start)}</span>`
          : on ? (s.end ? `<span class="badge">Fin ${monthShort(s.end)}</span>` : '<span class="badge">Active</span>')
          : `<span class="badge grey">Arrêtée</span>`;
        const hist = s.versions.length > 1
          ? `<span class="badge grey" title="${esc(s.versions.map(x => `${monthShort(x.from)} : ${eur(x.amount)}`).join(' · '))}">${plural(s.versions.length, 'montant')}</span>` : '';
        return `<tr style="${on ? '' : 'opacity:.55'}">
          <td class="cell-desc"><b>${esc(v.name)}</b> ${hist}${v.notes ? `<small>${esc(v.notes)}</small>` : ''}</td>
          <td>${catTag(v.cat)}</td><td>${tagsOf(v).length ? `<div class="tags">${tagsOf(v).map(g => catTag(g, true)).join('')}</div>` : '<span class="mut">–</span>'}</td>
          <td class="mut">${v.day}</td><td>${status}</td>
          <td class="r num ${type}" style="font-weight:600">${eur(v.amount)}</td>
          <td class="r num mut">${eur(v.amount * 12)}</td>
          <td class="r num mut">${on && tot ? pct(v.amount / tot * 100) : '–'}</td>
          <td class="r">
            <button class="icon-btn" title="${on ? 'Arrêter' : 'Reprendre'}" data-toggle-sub="${s.id}">${ic(on ? 'pause' : 'play')}</button>
            <button class="icon-btn" title="Modifier" data-edit-sub="${s.id}">${ic('edit')}</button>
            <button class="icon-btn del" title="Supprimer" data-del-sub="${s.id}">${ic('trash')}</button></td></tr>`;
      }).join('') + `<tr><td colspan="5"><b>Total actif</b></td><td class="r num"><b>${eur(tot)}</b></td><td class="r num mut">${eur(tot * 12)}</td><td colspan="2"></td></tr></tbody>`;
  };
  $('#subOutTable').innerHTML = table('out');
  $('#subInTable').innerHTML = table('in');
}

// ================= Catégories =================
function renderCats() {
  const st = stats(R);
  const byCatIn = st.byCatIn, byTagAll = new Map();
  st.items.forEach(t => { for (const g of tagsOf(t)) byTagAll.set(g, (byTagAll.get(g) || 0) + t.amount); });
  const card = (c, sense) => {
    const total = (sense === 'out' ? st.byCatOut : byCatIn).get(c.id) || 0;
    const base = sense === 'out' ? st.out : st.inn;
    const tagged = byTagAll.get(c.id) || 0;
    const rules = sense === 'out' ? ruleStatus(c, st) : [];
    return `<div class="card cat-card">
      <div class="cat-head clickable" data-cat-detail="${c.id}" title="Détail"><div class="sw" style="background:${c.color}">${esc(c.name.slice(0, 1).toUpperCase())}</div>
        <div><div class="nm">${esc(c.name)} ${c.type === 'both' ? '<span class="badge grey">Les deux</span>' : ''}</div><div class="mut" style="font-size:12px">${base ? pct(total / base * 100) : '0 %'} des ${sense === 'out' ? 'sorties' : 'entrées'}${tagged ? ` · étiquette : ${eur(tagged)}` : ''}</div></div>
        <div class="am"><div class="num ${sense}" style="font-weight:700">${eur(total)}</div></div>
      </div>
      ${rules.length ? rules.map(rs => `<div class="rule"><div class="top"><span>${rs.label}</span><span>${rs.detail}</span></div><div class="prog ${rs.level}"><i style="width:${Math.min(100, rs.ratio * 100)}%"></i></div></div>`).join('') : sense === 'out' ? '<div class="mut" style="font-size:12px">Aucune règle</div>' : ''}
      <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:auto">
        <button class="btn sm" data-edit-cat="${c.id}">${ic('edit')}Modifier</button>
        <button class="btn sm danger" data-del-cat="${c.id}">${ic('trash')}</button>
      </div></div>`;
  };
  const empty = t => `<div class="card empty" style="grid-column:1/-1">Aucune catégorie. <a href="#" data-new-cat="${t}">Créer</a></div>`;
  $('#catsOut').innerHTML = catsOf('out').map(c => card(c, 'out')).join('') || empty('out');
  $('#catsIn').innerHTML = catsOf('in').map(c => card(c, 'in')).join('') || empty('in');
}

function catDetail(id) {
  const c = cat(id); if (!c) return;
  const endM = R.end.slice(0, 7), months = [...Array(12)].map((_, i) => shiftMonth(endM, i - 11));
  const series = months.map(m => { const it = monthItems(m); return { main: sumBy(it.filter(t => t.cat === id)), tag: sumBy(it.filter(t => tagsOf(t).includes(id))) }; });
  const history = itemsIn('0000-01-01', [todayStr(), ...D.tx.map(t => t.date)].sort().pop()).filter(t => t.cat === id || tagsOf(t).includes(id));
  const total12 = sumBy(series, s => s.main), activeMonths = series.filter(s => s.main > 0).length;
  const st = stats(R), rules = c.type === 'out' ? ruleStatus(c, st) : [];
  const periodTotal = (c.type === 'out' ? st.byCatOut : st.byCatIn).get(id) || 0;
  const maxM = series.reduce((a, s, i) => (s.main > series[a].main ? i : a), 0);
  modal({
    title: `${esc(c.name)} <span class="badge grey" style="margin-left:8px">${CAT_TYPES[c.type] || 'Sortie'}</span>`,
    wide: true, cancel: false, submit: 'Fermer',
    body: `<div class="grid g4">
        ${[['Période affichée', eur(periodTotal), rangeLabel(R)], ['Total 12 mois', eur(total12), `${monthShort(months[0])} – ${monthShort(endM)}`], ['Moyenne / mois', eur(total12 / 12), activeMonths ? `${plural(activeMonths, 'mois')} actifs` : '–'], ['Mois le plus élevé', series[maxM].main ? eur(series[maxM].main) : '–', series[maxM].main ? monthLabel(months[maxM]) : '–']]
          .map(([l, v, s]) => `<div class="card stat"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div>`).join('')}
      </div>
      <div class="card"><h3>12 mois</h3><div class="chart-box sm"><canvas id="ch-catdetail"></canvas></div></div>
      ${rules.length ? `<div class="card"><h3>Règles <span class="mut">${esc(rangeLabel(R))}</span></h3>${rules.map(rs => `<div class="rule"><div class="top"><span>${rs.label}</span><span>${rs.detail}</span></div><div class="prog ${rs.level}"><i style="width:${Math.min(100, rs.ratio * 100)}%"></i></div></div>`).join('')}</div>` : ''}
      <div class="card"><h3>Historique <span class="mut">${plural(history.length, 'transaction')}</span></h3>
        <div class="table-wrap" style="max-height:320px;overflow-y:auto"><table><tbody>
        ${history.slice(0, 500).map(t => `<tr><td class="num mut" style="width:100px">${fmtDate(t.date)}</td><td class="cell-desc"><b>${esc(t.desc) || '–'}</b> ${t.sub ? '<span class="badge">Mensualité</span>' : ''} ${t.cat !== id ? '<span class="badge grey">Étiquette</span>' : ''}${t.notes ? `<small>${esc(t.notes)}</small>` : ''}</td><td><div class="tags">${t.cat !== id ? catTag(t.cat) : ''}${tagsOf(t).filter(g => g !== id).map(g => catTag(g, true)).join('')}</div></td><td class="r num ${t.type}" style="font-weight:600">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</td></tr>`).join('') || '<tr><td class="empty">Aucune transaction</td></tr>'}
        </tbody></table></div></div>`,
    onMount: () => chart('ch-catdetail', {
      type: 'bar',
      data: { labels: months.map(monthShort), datasets: [
        { label: 'Catégorie principale', data: series.map(s => s.main), backgroundColor: c.color, borderRadius: 5, maxBarThickness: 28, stack: 's' },
        { label: 'En étiquette', data: series.map(s => s.tag), backgroundColor: c.color + '55', borderRadius: 5, maxBarThickness: 28, stack: 's' }
      ] },
      options: { maintainAspectRatio: false, plugins: { legend: legendBottom, tooltip: tooltipEur }, scales: { x: { grid: { display: false }, stacked: true }, y: { ...axisEur(), stacked: true } } }
    }),
    onSubmit: () => {}
  });
}

// ================= Objectifs =================
function renderGoals() {
  const saved = g => sumBy(g.moves);
  const totalSaved = sumBy(D.goals, saved), totalTarget = sumBy(D.goals, g => g.target);
  const m = thisMonth(), mr = makeRange('month', todayStr());
  $('#goalKpis').innerHTML = [
    ['Total épargné', eur(totalSaved), plural(D.goals.length, 'objectif')],
    ['Total visé', eur(totalTarget), totalTarget ? `${pct(totalSaved / totalTarget * 100)} atteint` : '–'],
    ['Épargne du mois', eur(stats(mr).savings), monthLabel(m)],
    ['Objectifs atteints', String(D.goals.filter(g => saved(g) >= g.target).length), `sur ${D.goals.length}`]
  ].map(([l, v, s]) => `<div class="card kpi"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div>`).join('');
  if (!D.goals.length) { $('#goalsGrid').innerHTML = '<div class="card empty" style="grid-column:1/-1">Aucun objectif</div>'; return; }
  $('#goalsGrid').innerHTML = D.goals.map(g => {
    const s = saved(g), p = g.target ? s / g.target * 100 : 0, left = Math.max(0, g.target - s);
    let pace = '';
    if (g.deadline && left > 0) {
      const monthsLeft = (+g.deadline.slice(0, 4) - +m.slice(0, 4)) * 12 + (+g.deadline.slice(5, 7) - +m.slice(5)) + 1;
      pace = monthsLeft > 0 ? `${eur(left / monthsLeft)} / mois jusqu'à ${monthShort(g.deadline.slice(0, 7))}` : '<span class="out">Échéance dépassée</span>';
    }
    const last = [...g.moves].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    return `<div class="card goal">
      <div class="cat-head"><div class="sw" style="background:${g.color}">${ic('target', 'stroke:#fff')}</div><div><div class="nm">${esc(g.name)}</div><div class="mut" style="font-size:12px">Objectif ${eur(g.target)}</div></div>
        <div class="am">${s >= g.target ? `<span class="badge" style="background:color-mix(in srgb,var(--in) 15%,transparent);color:var(--in)">Atteint</span>` : ''}</div></div>
      <div class="big" style="margin-top:14px">${eur(s)} <span class="mut" style="font-size:14px;font-weight:400">${pct(p, 0)}</span></div>
      <div class="prog"><i style="width:${Math.min(100, p)}%;background:${g.color}"></i></div>
      <div class="mut" style="font-size:13px">${left > 0 ? `Reste ${eur(left)}` : 'Objectif atteint'}${pace ? ` · ${pace}` : ''}</div>
      ${last.length ? `<div style="margin-top:12px;font-size:12px">${last.map(mv => `<div style="display:flex;justify-content:space-between;padding:3px 0"><span class="mut">${fmtDate(mv.date)}</span><span class="num ${mv.amount >= 0 ? 'in' : 'out'}">${signed(mv.amount)}</span></div>`).join('')}</div>` : ''}
      <div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap">
        <button class="btn sm pri" data-goal-move="${g.id}" data-dir="1">${ic('plus')}Versement</button>
        <button class="btn sm" data-goal-move="${g.id}" data-dir="-1">Retrait</button>
        <span style="flex:1"></span>
        <button class="icon-btn" title="Modifier" data-edit-goal="${g.id}">${ic('edit')}</button>
        <button class="icon-btn del" title="Supprimer" data-del-goal="${g.id}">${ic('trash')}</button>
      </div></div>`;
  }).join('');
}

function renderSettings() {
  syncUi();
  $('#autoLock').value = String(D.settings.autoLock || 0);
  const o = D.settings.opening || { amount: 0, date: '' };
  $('#openAmount').value = o.amount ? String(o.amount).replace('.', ',') : '';
  $('#openDate').value = o.date || '';
  api.version().then(v => { $('#appVersion').textContent = v; }).catch(() => {});
}

// ================= Modales =================
const KEEP_OPEN = Symbol('keep');
function modal({ title, body, submit = 'Enregistrer', danger = false, wide = false, cancel = true, extraFooter = '', onSubmit, onMount }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<form class="modal ${wide ? 'wide' : ''}" novalidate><header><h3>${title}</h3><button type="button" class="icon-btn" data-close>${ic('x')}</button></header>
    <div class="body">${body}<div class="err" data-err></div></div>
    <footer>${extraFooter}${cancel ? '<button type="button" class="btn" data-close>Annuler</button>' : ''}<button class="btn ${danger ? 'danger' : 'pri'}">${submit}</button></footer></form>`;
  document.body.appendChild(bg);
  const form = $('form', bg);
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $$('[data-close]', bg).forEach(b => b.onclick = close);
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  form.onsubmit = async e => {
    e.preventDefault();
    const errEl = $('[data-err]', bg);
    errEl.classList.remove('ok');
    const res = await onSubmit(form, errEl);
    if (res === KEEP_OPEN) return;
    if (typeof res === 'string') { errEl.textContent = res; return; }
    close();
  };
  onMount?.(form);
  setTimeout(() => $('input:not([type=hidden]):not([type=checkbox]),select', form)?.focus(), 30);
  return form;
}
const confirmModal = (title, text, action = 'Supprimer') => new Promise(res => {
  let ok = false;
  const f = modal({ title, body: `<p style="margin:0">${text}</p>`, submit: action, danger: true, onSubmit: () => { ok = true; } });
  new MutationObserver((_, obs) => { if (!document.body.contains(f)) { obs.disconnect(); res(ok); } }).observe(document.body, { childList: true });
});

const catOptions = (type, selected) => catsOf(type).map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const catChips = (name, selected, label) => {
  const list = [...new Map([...catsOf('out'), ...catsOf('in')].map(c => [c.id, c])).values()];
  return `<div class="f"><span>${label} <small class="mut">(plusieurs possibles)</small></span><div class="tag-pick">${list.map(c =>
    `<label class="tag lbl pick"><input type="checkbox" name="${name}" value="${c.id}" ${selected.includes(c.id) ? 'checked' : ''}><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</label>`).join('') || '<span class="mut">Aucune catégorie</span>'}</div></div>`;
};
const tagPicker = selected => catChips('tags', selected, 'Étiquettes');
// Masque l'étiquette correspondant à la catégorie choisie ; à rappeler quand la liste des catégories change.
const bindTagPick = form => {
  const upd = () => form.querySelectorAll('input[name="tags"]').forEach(i => {
    const off = i.value === form.cat.value;
    i.closest('label').style.display = off ? 'none' : '';
    if (off) i.checked = false;
  });
  form.cat.addEventListener('change', upd);
  upd();
  return upd;
};
// Étiquettes cochées, sans la catégorie principale.
const pickedTags = form => Array.from(form.querySelectorAll('input[name="tags"]:checked'), i => i.value).filter(id => id !== form.cat.value);
const typeSeg = type => `<div class="seg type" data-type-seg style="align-self:flex-start"><button type="button" data-v="out" class="${type === 'out' ? 'on' : ''}">Sortie</button><button type="button" data-v="in" class="${type === 'in' ? 'on' : ''}">Entrée</button></div>`;
function bindTypeSeg(form, onChange) {
  $$('[data-type-seg] button', form).forEach(b => b.onclick = () => {
    $$('[data-type-seg] button', form).forEach(x => x.classList.toggle('on', x === b));
    onChange(b.dataset.v);
  });
}
const segVal = form => $('[data-type-seg] button.on', form).dataset.v;
const catTypeSeg = type => `<div class="seg type3" data-type-seg style="align-self:flex-start">${Object.entries(CAT_TYPES).map(([v, l]) => `<button type="button" data-v="${v}" class="${type === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const NO_CAT = 'Aucune catégorie de ce type. Créer une catégorie dans Catégories.';

function txModal(existing, presetType) {
  const t = existing || { type: presetType || 'out', amount: '', date: todayStr() >= R.start && todayStr() <= R.end ? todayStr() : R.start, cat: '', tag: '', tags: [], desc: '', notes: '' };
  let added = 0;
  modal({
    title: existing ? 'Modifier la transaction' : 'Nouvelle transaction',
    submit: existing ? 'Enregistrer' : 'Ajouter',
    extraFooter: existing ? '' : `<label class="check"><input type="checkbox" name="serial" ${D.settings.serial ? 'checked' : ''}>Saisie en série</label>`,
    body: `${typeSeg(t.type)}
      <div class="row"><label class="f">Montant (€)<input name="amount" inputmode="decimal" value="${t.amount}" placeholder="0,00"></label>
        <label class="f">Date<input name="date" type="date" value="${t.date}"></label></div>
      <label class="f">Catégorie<select name="cat"></select></label>
      ${tagPicker(tagsOf(t))}
      <label class="f">Description<input name="desc" value="${esc(t.desc)}"></label>
      <label class="f">Notes<textarea name="notes">${esc(t.notes)}</textarea></label>`,
    onMount: form => {
      const fill = type => { form.cat.innerHTML = catsOf(type).length ? catOptions(type, t.cat) : '<option value="">–</option>'; };
      fill(t.type);
      const updTags = bindTagPick(form);
      bindTypeSeg(form, type => { fill(type); updTags(); });
      if (form.serial) form.serial.onchange = () => { D.settings.serial = form.serial.checked; stampSettings(); persist(); };
    },
    onSubmit: (form, errEl) => {
      const amount = parseAmount(form.amount.value);
      if (!(amount > 0)) return 'Montant invalide.';
      if (!form.date.value) return 'Date manquante.';
      if (!form.cat.value) return NO_CAT;
      const data = { type: segVal(form), amount, date: form.date.value, cat: form.cat.value, ...withTags(pickedTags(form)), desc: form.desc.value.trim(), notes: form.notes.value.trim() };
      if (existing) stamp(Object.assign(D.tx.find(x => x.id === existing.id), data));
      else D.tx.push(stamp({ id: uid(), ...data }));
      if (data.date < R.start || data.date > R.end) R = R.kind === 'custom' ? makeRange('month', data.date) : makeRange(R.kind, data.date);
      persist(); render();
      if (!existing && form.serial?.checked) {
        added++;
        errEl.classList.add('ok');
        errEl.textContent = `Ajouté : ${data.desc || catName(data.cat)} ${data.type === 'in' ? '+' : '−'}${eur(amount)} · ${plural(added, 'saisie')}`;
        form.amount.value = ''; form.desc.value = ''; form.notes.value = ''; form.querySelectorAll('input[name="tags"]').forEach(i => { i.checked = false; });
        form.amount.focus();
        return KEEP_OPEN;
      }
      toast(existing ? 'Transaction modifiée' : 'Transaction ajoutée');
    }
  });
}

function subModal(existing) {
  const cur = existing ? subNow(existing) : null;
  const s = existing
    ? { type: existing.type, name: cur.name, amount: cur.amount, cat: cur.cat, tags: tagsOf(cur), day: cur.day, start: existing.start, end: existing.end || '', notes: cur.notes || '' }
    : { type: 'out', name: '', amount: '', cat: '', tags: [], day: 1, start: thisMonth(), end: '', notes: '' };
  const versionsHtml = () => !existing || existing.versions.length < 2 ? '' :
    `<div class="f"><span>Historique des montants</span>
      ${existing.versions.map((v, i) => `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-top:1px solid var(--bd)">
        <span class="mut" style="width:90px">${i === 0 ? 'Depuis' : 'À partir de'}</span><b>${monthLabel(v.from)}</b>
        <span class="num" style="margin-left:auto">${eur(v.amount)}</span>
        ${i ? `<button type="button" class="icon-btn del" data-vdel="${i}" title="Supprimer ce changement">${ic('trash')}</button>` : ''}
      </div>`).join('')}</div>`;
  modal({
    title: existing ? 'Modifier la mensualité' : 'Nouvelle mensualité',
    submit: existing ? 'Enregistrer' : 'Ajouter',
    body: `${typeSeg(s.type)}
      <div class="row"><label class="f">Nom<input name="name" value="${esc(s.name)}"></label>
        <label class="f" style="flex:.6">Montant (€)<input name="amount" inputmode="decimal" value="${s.amount}" placeholder="0,00"></label></div>
      <label class="f">Catégorie<select name="cat"></select></label>
      ${tagPicker(s.tags)}
      <div class="row"><label class="f">Jour du mois<input name="day" type="number" min="1" max="31" value="${s.day}"></label>
        <label class="f">Début<input name="start" type="month" value="${s.start}"></label>
        <label class="f">Fin (optionnel)<input name="end" type="month" value="${s.end || ''}"></label></div>
      ${existing ? `<label class="f">Prise d'effet des modifications<input name="effective" type="month" value="${thisMonth()}"><span style="font-size:12px">Les mois antérieurs conservent les valeurs actuelles.</span></label>` : ''}
      <label class="f">Notes<textarea name="notes">${esc(s.notes || '')}</textarea></label>
      ${versionsHtml()}`,
    onMount: form => {
      const fill = type => { form.cat.innerHTML = catsOf(type).length ? catOptions(type, s.cat) : '<option value="">–</option>'; };
      fill(s.type); const updTags = bindTagPick(form); bindTypeSeg(form, type => { fill(type); updTags(); });
      $$('[data-vdel]', form).forEach(b => b.onclick = async () => {
        const i = +b.dataset.vdel;
        if (!await confirmModal('Supprimer ce changement', `Le montant appliqué depuis ${monthLabel(existing.versions[i].from)} sera supprimé : la valeur précédente s'appliquera de nouveau.`)) return;
        existing.versions.splice(i, 1);
        stamp(Object.assign(existing, subNow(existing)));
        persist(); render();
        $$('.modal-bg').forEach(x => x.remove());
        subModal(existing);
      });
    },
    onSubmit: form => {
      const amount = parseAmount(form.amount.value), day = +form.day.value;
      if (!form.name.value.trim()) return 'Nom manquant.';
      if (!(amount > 0)) return 'Montant invalide.';
      if (!form.cat.value) return NO_CAT;
      if (!(day >= 1 && day <= 31)) return 'Jour invalide (1 à 31).';
      if (!form.start.value) return 'Mois de début manquant.';
      if (form.end.value && form.end.value < form.start.value) return 'La fin précède le début.';
      const type = segVal(form);
      const version = { amount, cat: form.cat.value, ...withTags(pickedTags(form)), day, name: form.name.value.trim(), notes: form.notes.value.trim(), type };
      if (existing) {
        const eff = form.effective.value;
        const from = eff && eff > form.start.value ? eff : form.start.value;
        const versions = existing.versions.filter(v => v.from !== from && v.from >= form.start.value);
        versions.push({ from, ...version });
        versions.sort((a, b) => a.from.localeCompare(b.from));
        versions[0].from = form.start.value;
        Object.assign(existing, { type, start: form.start.value, end: form.end.value || '', versions });
        stamp(Object.assign(existing, subNow(existing), { type, start: form.start.value, end: form.end.value || '', versions }));
      } else {
        D.subs.push(stamp({ id: uid(), type, start: form.start.value, end: form.end.value || '', ...version, versions: [{ from: form.start.value, ...version }] }));
      }
      persist(); render();
      toast(existing ? 'Mensualité modifiée' : 'Mensualité ajoutée');
    }
  });
}

function ruleRow(r = { kind: 'budget', value: '', warn: 80 }) {
  return `<div class="rule-row">
    <label class="f">Type<select data-r="kind"><option value="budget" ${r.kind === 'budget' ? 'selected' : ''}>Budget max (€ / mois)</option><option value="pct" ${r.kind === 'pct' ? 'selected' : ''}>Part max des entrées (%)</option></select></label>
    <label class="f"><span data-r-lbl>${r.kind === 'pct' ? 'Maximum (%)' : 'Maximum (€)'}</span><input data-r="value" inputmode="decimal" value="${r.value}"></label>
    <label class="f">Alerte à (%)<input data-r="warn" type="number" min="1" max="100" value="${r.warn ?? 80}"></label>
    <button type="button" class="icon-btn del" data-r-del title="Retirer">${ic('trash')}</button></div>`;
}

function catModal(existing, presetType) {
  const c = existing || { name: '', type: presetType || 'out', color: PALETTE[D.cats.length % PALETTE.length], rules: [] };
  let color = c.color;
  modal({
    title: existing ? 'Modifier la catégorie' : 'Nouvelle catégorie',
    submit: existing ? 'Enregistrer' : 'Créer',
    body: `${catTypeSeg(c.type)}
      <label class="f">Nom<input name="name" value="${esc(c.name)}"></label>
      <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--mut)">Couleur
        <div class="swatches">${PALETTE.map(p => `<button type="button" data-sw="${p}" style="background:${p}" class="${p === color ? 'on' : ''}"></button>`).join('')}<input type="color" data-sw-custom value="${color}" title="Couleur personnalisée"></div></div>
      <div class="rules-edit" ${c.type === 'in' ? 'hidden' : ''}>
        <div style="font-weight:600;margin:6px 0 4px">Règles</div>
        <p class="mut" style="margin:0 0 10px;font-size:12px">Budget en € par mois (ajusté automatiquement à la période affichée) ou part maximale des entrées. Alerte : seuil en % de la limite.</p>
        <div data-rules>${(c.rules || []).map(ruleRow).join('')}</div>
        <button type="button" class="btn sm" data-add-rule>${ic('plus')}Ajouter une règle</button>
      </div>`,
    onMount: form => {
      const pick = v => { color = v; $$('[data-sw]', form).forEach(b => b.classList.toggle('on', b.dataset.sw === v)); $('[data-sw-custom]', form).value = v; };
      $$('[data-sw]', form).forEach(b => b.onclick = () => pick(b.dataset.sw));
      $('[data-sw-custom]', form).oninput = e => pick(e.target.value);
      $('[data-add-rule]', form).onclick = () => $('[data-rules]', form).insertAdjacentHTML('beforeend', ruleRow());
      form.addEventListener('click', e => { const d = e.target.closest('[data-r-del]'); if (d) d.closest('.rule-row').remove(); });
      form.addEventListener('change', e => { if (e.target.dataset.r === 'kind') $('[data-r-lbl]', e.target.closest('.rule-row')).textContent = e.target.value === 'pct' ? 'Maximum (%)' : 'Maximum (€)'; });
      bindTypeSeg(form, t => { $('.rules-edit', form).hidden = t === 'in'; });
    },
    onSubmit: form => {
      const name = form.name.value.trim();
      if (!name) return 'Nom manquant.';
      const type = segVal(form);
      const overlap = (a, b) => a === b || a === 'both' || b === 'both';
      if (D.cats.some(x => x.id !== existing?.id && overlap(x.type, type) && x.name.toLowerCase() === name.toLowerCase())) return 'Catégorie déjà existante.';
      if (existing) {
        const u = catUsage(existing.id);
        if (type === 'out' && u.inUse) return 'Catégorie utilisée par des entrées : choisir « Entrée » ou « Les deux ».';
        if (type === 'in' && u.outUse) return 'Catégorie utilisée par des sorties : choisir « Sortie » ou « Les deux ».';
      }
      const rules = [];
      if (type === 'out') for (const row of $$('.rule-row', form)) {
        const kind = $('[data-r=kind]', row).value, value = parseAmount($('[data-r=value]', row).value), warn = +$('[data-r=warn]', row).value || 80;
        if (!(value > 0)) return 'Règle : maximum invalide.';
        if (kind === 'pct' && value > 100) return 'Règle : pourcentage supérieur à 100.';
        rules.push({ kind, value, warn: Math.min(100, Math.max(1, warn)) });
      }
      if (existing) stamp(Object.assign(D.cats.find(x => x.id === existing.id), { name, type, color, rules }));
      else D.cats.push(stamp({ id: uid(), name, type, color, rules }));
      persist(); render();
      toast(existing ? 'Catégorie modifiée' : 'Catégorie créée');
    }
  });
}

function goalModal(existing) {
  const g = existing || { name: '', target: '', deadline: '', color: PALETTE[(D.goals.length + 2) % PALETTE.length] };
  let color = g.color;
  modal({
    title: existing ? "Modifier l'objectif" : 'Nouvel objectif',
    submit: existing ? 'Enregistrer' : 'Créer',
    body: `<label class="f">Nom<input name="name" value="${esc(g.name)}"></label>
      <div class="row"><label class="f">Montant visé (€)<input name="target" inputmode="decimal" value="${g.target}"></label>
        <label class="f">Échéance (optionnel)<input name="deadline" type="month" value="${g.deadline ? g.deadline.slice(0, 7) : ''}"></label></div>
      ${existing ? '' : `<label class="f">Montant déjà épargné (optionnel)<input name="initial" inputmode="decimal" placeholder="0,00"></label>`}
      <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--mut)">Couleur
        <div class="swatches">${PALETTE.map(p => `<button type="button" data-sw="${p}" style="background:${p}" class="${p === color ? 'on' : ''}"></button>`).join('')}</div></div>`,
    onMount: form => $$('[data-sw]', form).forEach(b => b.onclick = () => { color = b.dataset.sw; $$('[data-sw]', form).forEach(x => x.classList.toggle('on', x === b)); }),
    onSubmit: form => {
      const target = parseAmount(form.target.value);
      if (!form.name.value.trim()) return 'Nom manquant.';
      if (!(target > 0)) return 'Montant visé invalide.';
      const data = { name: form.name.value.trim(), target, deadline: form.deadline.value || '', color };
      if (existing) stamp(Object.assign(D.goals.find(x => x.id === existing.id), data));
      else {
        const init = form.initial.value.trim() ? parseAmount(form.initial.value) : 0;
        if (!(init >= 0)) return 'Montant déjà épargné invalide.';
        D.goals.push(stamp({ id: uid(), ...data, moves: init > 0 ? [{ id: uid(), date: todayStr(), amount: init }] : [] }));
      }
      persist(); render();
    }
  });
}

function goalMoveModal(g, dir) {
  const saved = sumBy(g.moves);
  modal({
    title: `${dir > 0 ? 'Versement' : 'Retrait'} · ${esc(g.name)}`,
    submit: 'Valider',
    body: `<div class="row"><label class="f">Montant (€)<input name="amount" inputmode="decimal" placeholder="0,00"></label><label class="f">Date<input name="date" type="date" value="${todayStr()}"></label></div>
      <p class="mut" style="margin:0;font-size:13px">Épargné : ${eur(saved)} / ${eur(g.target)}</p>`,
    onSubmit: form => {
      const a = parseAmount(form.amount.value);
      if (!(a > 0)) return 'Montant invalide.';
      if (dir < 0 && a > saved) return `Retrait maximum : ${eur(saved)}.`;
      g.moves.push({ id: uid(), date: form.date.value || todayStr(), amount: a * dir });
      stamp(g);
      persist(); render();
    }
  });
}

// ================= Exports =================
function exportRange() {
  if ($('#expPeriod').value === 'range') return R;
  const last = [todayStr(), ...D.tx.map(t => t.date)].sort().pop();
  return { kind: 'custom', start: firstDate(), end: last };
}

async function exportXlsx() {
  const r = exportRange(), items = itemsIn(r.start, r.end).sort((a, b) => a.date.localeCompare(b.date));
  const months = []; for (let m = r.start.slice(0, 7); m <= r.end.slice(0, 7); m = shiftMonth(m, 1)) months.push(m);
  const summary = months.map(m => {
    const s = stats({ kind: 'month', start: `${m}-01`, end: `${m}-${daysIn(m)}` });
    return { mois: monthLabel(m), entrees: s.inn, sorties: s.out, fixes: s.fixedOut, variables: s.varOut, epargne: s.savings, resultat: s.net, solde: balanceAt(`${m}-${daysIn(m)}`), taux: s.inn ? s.savings / s.inn : 0 };
  });
  const byCat = new Map();
  for (const t of items) { const k = t.type + t.cat; const e = byCat.get(k) || { type: t.type === 'in' ? 'Entrée' : 'Sortie', cat: catName(t.cat), total: 0, n: 0 }; e.total += t.amount; e.n++; byCat.set(k, e); }
  const totIn = sumBy(items.filter(t => t.type === 'in')), totOut = sumBy(items.filter(t => t.type === 'out'));
  const res = await api.exportXlsx({
    filename: `Tmoney-${r.start}_${r.end}.xlsx`,
    sheets: [
      { name: 'Résumé', columns: [{ header: 'Mois', key: 'mois', width: 18 }, { header: 'Entrées', key: 'entrees', money: 1 }, { header: 'Sorties', key: 'sorties', money: 1 }, { header: 'Sorties fixes', key: 'fixes', money: 1 }, { header: 'Sorties variables', key: 'variables', money: 1, width: 18 }, { header: 'Épargne', key: 'epargne', money: 1 }, { header: 'Résultat', key: 'resultat', money: 1 }, { header: 'Solde fin de mois', key: 'solde', money: 1, width: 18 }, { header: "Taux d'épargne", key: 'taux', pct: 1 }], rows: summary },
      { name: 'Par catégorie', columns: [{ header: 'Type', key: 'type', width: 10 }, { header: 'Catégorie', key: 'cat', width: 24 }, { header: 'Total', key: 'total', money: 1 }, { header: 'Nombre', key: 'n', width: 10 }, { header: 'Part', key: 'part', pct: 1 }],
        rows: [...byCat.values()].sort((a, b) => a.type.localeCompare(b.type) || b.total - a.total).map(e => ({ ...e, part: e.total / ((e.type === 'Entrée' ? totIn : totOut) || 1) })) },
      { name: 'Transactions', columns: [{ header: 'Date', key: 'date', width: 12 }, { header: 'Type', key: 'type', width: 10 }, { header: 'Catégorie', key: 'cat', width: 22 }, { header: 'Étiquette', key: 'tag', width: 22 }, { header: 'Description', key: 'desc', width: 30 }, { header: 'Notes', key: 'notes', width: 36 }, { header: 'Montant', key: 'amount', money: 1 }, { header: 'Mensualité', key: 'sub', width: 12 }],
        rows: items.map(t => ({ date: fmtDate(t.date), type: t.type === 'in' ? 'Entrée' : 'Sortie', cat: catName(t.cat), tag: tagNames(t), desc: t.desc, notes: t.notes, amount: signOf(t), sub: t.sub ? 'Oui' : '' })) },
      { name: 'Mensualités', columns: [{ header: 'Nom', key: 'name', width: 24 }, { header: 'Type', key: 'type', width: 10 }, { header: 'Catégorie', key: 'cat', width: 22 }, { header: 'Jour', key: 'day', width: 8 }, { header: 'Montant', key: 'amount', money: 1 }, { header: 'Par an', key: 'year', money: 1 }, { header: 'Début', key: 'start' }, { header: 'Fin', key: 'end' }],
        rows: D.subs.map(s => { const v = subNow(s); return { name: v.name, type: s.type === 'in' ? 'Entrée' : 'Sortie', cat: catName(v.cat), day: v.day, amount: v.amount, year: v.amount * 12, start: s.start, end: s.end || '' }; }) },
      { name: 'Catégories', columns: [{ header: 'Nom', key: 'name', width: 24 }, { header: 'Type', key: 'type', width: 12 }, { header: 'Couleur', key: 'color', width: 12 }, { header: 'Règles', key: 'rules', width: 40 }],
        rows: D.cats.map(c => ({ name: c.name, type: CAT_TYPES[c.type] || 'Sortie', color: c.color, rules: (c.rules || []).map(r => r.kind === 'budget' ? `Budget ${r.value} €/mois (alerte ${r.warn} %)` : `Max ${r.value} % des entrées (alerte ${r.warn} %)`).join(' | ') })) },
      { name: 'Épargne', columns: [{ header: 'Objectif', key: 'goal', width: 24 }, { header: 'Date', key: 'date', width: 12 }, { header: 'Montant', key: 'amount', money: 1 }],
        rows: D.goals.flatMap(g => g.moves.map(mv => ({ goal: g.name, date: fmtDate(mv.date), amount: mv.amount }))) },
      { name: 'Objectifs', columns: [{ header: 'Objectif', key: 'name', width: 24 }, { header: 'Visé', key: 'target', money: 1 }, { header: 'Épargné', key: 'saved', money: 1 }, { header: 'Progression', key: 'p', pct: 1 }, { header: 'Échéance', key: 'deadline' }],
        rows: D.goals.map(g => { const s = sumBy(g.moves); return { name: g.name, target: g.target, saved: s, p: g.target ? s / g.target : 0, deadline: g.deadline || '' }; }) }
    ]
  });
  if (res) toast('Export Excel enregistré');
}

async function importXlsx() {
  const res = await api.importXlsx();
  if (!res) return;
  const sh = res.sheets || {};
  const n = { cats: 0, tx: 0, dup: 0, subs: 0, goals: 0, moves: 0 };
  const num = v => (typeof v === 'number' ? v : parseAmount(String(v ?? '').replace(/[^0-9,.\-]/g, '')));
  const date = v => {
    if (!v) return '';
    if (v instanceof Date) return ds(v);
    const t = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return `${t.slice(6, 10)}-${t.slice(3, 5)}-${t.slice(0, 2)}`;
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
    const d = new Date(t);
    return isNaN(d) ? '' : ds(d);
  };
  const month = v => { const d = date(v); return d ? d.slice(0, 7) : String(v ?? '').trim().slice(0, 7); };
  const typeOf = v => (String(v ?? '').trim().toLowerCase().startsWith('entr') ? 'in' : 'out');
  const ensureCat = (name, type, color) => {
    name = String(name ?? '').trim();
    if (!name) return '';
    let c = D.cats.find(x => x.name.toLowerCase() === name.toLowerCase() && (x.type === type || x.type === 'both'));
    if (!c) {
      c = stamp({ id: uid(), name, type, color: color || PALETTE[D.cats.length % PALETTE.length], rules: [] });
      D.cats.push(c); n.cats++;
    }
    return c.id;
  };
  for (const r of sh['Catégories'] || []) {
    const type = { 'Sortie': 'out', 'Entrée': 'in', 'Les deux': 'both' }[String(r['Type'] ?? '').trim()] || 'out';
    ensureCat(r['Nom'], type, String(r['Couleur'] ?? '').trim() || null);
  }
  for (const r of sh['Transactions'] || []) {
    if (String(r['Mensualité'] ?? '').trim().toLowerCase() === 'oui') continue;
    const d = date(r['Date']), amount = Math.abs(num(r['Montant'])), type = typeOf(r['Type']);
    if (!d || !(amount > 0)) continue;
    const cat = ensureCat(r['Catégorie'], type);
    const tags = String(r['Étiquette'] ?? '').split(',').map(x => x.trim()).filter(Boolean).map(x => ensureCat(x, type)).filter(id => id !== cat);
    const desc = String(r['Description'] ?? '').trim();
    if (D.tx.some(t => t.date === d && t.type === type && Math.abs(t.amount - amount) < 0.005 && (t.desc || '') === desc && t.cat === cat)) { n.dup++; continue; }
    D.tx.push(stamp({ id: uid(), type, amount, date: d, cat, ...withTags([...new Set(tags)]), desc, notes: String(r['Notes'] ?? '').trim() }));
    n.tx++;
  }
  for (const r of sh['Mensualités'] || []) {
    const name = String(r['Nom'] ?? '').trim(), amount = Math.abs(num(r['Montant'])), type = typeOf(r['Type']);
    if (!name || !(amount > 0)) continue;
    if (D.subs.some(x => subNow(x).name.toLowerCase() === name.toLowerCase() && x.type === type)) { n.dup++; continue; }
    const start = month(r['Début']) || thisMonth();
    const version = { amount, cat: ensureCat(r['Catégorie'], type), tag: '', day: Math.min(31, Math.max(1, +r['Jour'] || 1)), name, notes: '', type };
    D.subs.push(stamp({ id: uid(), type, start, end: month(r['Fin']) || '', ...version, versions: [{ from: start, ...version }] }));
    n.subs++;
  }
  for (const r of sh['Objectifs'] || []) {
    const name = String(r['Objectif'] ?? '').trim(), target = num(r['Visé']);
    if (!name || !(target > 0)) continue;
    if (D.goals.some(g => g.name.toLowerCase() === name.toLowerCase())) { n.dup++; continue; }
    D.goals.push(stamp({ id: uid(), name, target, deadline: month(r['Échéance']) || '', color: PALETTE[(D.goals.length + 2) % PALETTE.length], moves: [] }));
    n.goals++;
  }
  const moves = sh['Épargne'] || [];
  for (const r of moves) {
    const g = D.goals.find(x => x.name.toLowerCase() === String(r['Objectif'] ?? '').trim().toLowerCase());
    const d = date(r['Date']), amount = num(r['Montant']);
    if (!g || !d || !amount) continue;
    if (g.moves.some(mv => mv.date === d && Math.abs(mv.amount - amount) < 0.005)) { n.dup++; continue; }
    g.moves.push({ id: uid(), date: d, amount }); stamp(g);
    n.moves++;
  }
  if (!moves.length) for (const r of sh['Objectifs'] || []) {
    const g = D.goals.find(x => x.name.toLowerCase() === String(r['Objectif'] ?? '').trim().toLowerCase());
    const saved = num(r['Épargné']);
    if (g && !g.moves.length && saved > 0) { g.moves.push({ id: uid(), date: todayStr(), amount: saved }); n.moves++; }
  }
  await persist(); render();
  modal({
    title: 'Import terminé', submit: 'OK', cancel: false,
    body: `<p style="margin:0 0 12px">Fichier : <b>${esc(res.file.split(/[\\/]/).pop())}</b></p>
      <table><tbody>
        <tr><td>Transactions ajoutées</td><td class="r num"><b>${n.tx}</b></td></tr>
        <tr><td>Mensualités ajoutées</td><td class="r num"><b>${n.subs}</b></td></tr>
        <tr><td>Catégories créées</td><td class="r num"><b>${n.cats}</b></td></tr>
        <tr><td>Objectifs ajoutés</td><td class="r num"><b>${n.goals}</b></td></tr>
        <tr><td>Mouvements d'épargne ajoutés</td><td class="r num"><b>${n.moves}</b></td></tr>
        <tr><td class="mut">Doublons ignorés</td><td class="r num mut">${n.dup}</td></tr>
      </tbody></table>`,
    onSubmit: () => {}
  });
}

function chartImage(config, w, h) {
  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${w}px;height:${h}px`;
  const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  holder.appendChild(cv); document.body.appendChild(holder);
  const prev = [Chart.defaults.color, Chart.defaults.borderColor];
  Chart.defaults.color = '#475569'; Chart.defaults.borderColor = '#e2e8f0';
  const c = new Chart(cv, { ...config, options: { ...config.options, responsive: false, animation: false, devicePixelRatio: 2 } });
  const url = c.toBase64Image();
  c.destroy(); holder.remove(); [Chart.defaults.color, Chart.defaults.borderColor] = prev;
  return url;
}

async function exportPdf() {
  // Le rapport affiche toujours les montants, même en mode discret
  const discreet = D.settings.discreet; D.settings.discreet = false;
  try {
    const r = R, st = stats(r), prev = stats(shiftRange(r, -1));
    const endM = r.end.slice(0, 7), months = [...Array(6)].map((_, i) => shiftMonth(endM, i - 5));
    const ms = months.map(m => { const it = monthItems(m); return { in: sumBy(it.filter(t => t.type === 'in')), out: sumBy(it.filter(t => t.type === 'out')) }; });
    const bars = chartImage({ type: 'bar', data: { labels: months.map(monthShort), datasets: [{ label: 'Entrées', data: ms.map(s => s.in), backgroundColor: '#12a064', borderRadius: 4 }, { label: 'Sorties', data: ms.map(s => s.out), backgroundColor: '#e0434b', borderRadius: 4 }] }, options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { ticks: { callback: v => eur0(v) } } } } }, 700, 240);
    const donut = entries => chartImage({ type: 'doughnut', data: { labels: entries.map(e => e.label), datasets: [{ data: entries.map(e => e.value), backgroundColor: entries.map(e => e.color), borderColor: '#fff', borderWidth: 2 }] }, options: { cutout: '62%', plugins: { legend: { display: false } } } }, 200, 200);
    const table = (entries, total) => entries.map(e => `<tr><td><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${e.color};margin-right:6px"></i>${esc(e.label)}</td><td class="r">${eur(e.value)}</td><td class="r">${pct(e.value / total * 100)}</td></tr>`).join('');
    const outE = mapEntries(st.byCatOut), inE = mapEntries(st.byCatIn);
    const rules = catsOf('out').flatMap(c => ruleStatus(c, st).map(x => ({ c, ...x })));
    const nb = elapsedDays(r);
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
      body{font-family:"Segoe UI",system-ui,sans-serif;color:#0f172a;margin:0;font-size:12px}
      h1{font-size:22px;margin:0}h2{font-size:14px;margin:22px 0 8px;color:#1e5fd1;border-bottom:1px solid #dfe5ef;padding-bottom:4px}
      .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2f7cf6;padding-bottom:10px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}.k{background:#f3f6fb;border-radius:8px;padding:10px}.k small{color:#64748b}.k b{display:block;font-size:17px;margin-top:3px}
      table{width:100%;border-collapse:collapse}td,th{padding:5px 6px;border-bottom:1px solid #eef2f8;text-align:left}th{color:#64748b;font-size:11px}.r{text-align:right}
      .two{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pie{display:flex;gap:12px;align-items:flex-start}.pie img{width:120px;height:120px}
      .in{color:#12a064}.out{color:#e0434b}.foot{margin-top:24px;color:#94a3b8;font-size:10px;text-align:center}
    </style></head><body>
      <div class="head"><div><h1>Rapport · ${esc(rangeLabel(r))}</h1><div style="color:#64748b">Tmoney · ${fmtDate(r.start)} – ${fmtDate(r.end)}</div></div><div style="color:#64748b">Édité le ${fmtDate(todayStr())}</div></div>
      <div class="kpis">
        <div class="k"><small>Solde fin de période</small><b>${eur(balanceAt(r.end))}</b></div>
        <div class="k"><small>Entrées</small><b class="in">${eur(st.inn)}</b></div>
        <div class="k"><small>Sorties</small><b class="out">${eur(st.out)}</b></div>
        <div class="k"><small>Résultat</small><b>${signed(st.net)}</b></div>
        <div class="k"><small>Sorties fixes / variables</small><b>${eur(st.fixedOut)} / ${eur(st.varOut)}</b></div>
        <div class="k"><small>Épargne</small><b>${eur(st.savings)} (${pct(st.inn ? st.savings / st.inn * 100 : 0)})</b></div>
        <div class="k"><small>Moyenne / jour</small><b>${eur(nb ? st.out / nb : 0)}</b></div>
        <div class="k"><small>Sorties vs période préc.</small><b>${prev.out ? (st.out >= prev.out ? '+' : '') + pct((st.out - prev.out) / prev.out * 100, 0) : '–'}</b></div>
      </div>
      <h2>Entrées et sorties sur 6 mois</h2><img src="${bars}" style="width:100%">
      <div class="two">
        <div><h2>Sorties par catégorie</h2>${outE.length ? `<div class="pie"><img src="${donut(outE)}"><table>${table(outE, st.out)}</table></div>` : '<p>Aucune sortie</p>'}</div>
        <div><h2>Entrées par catégorie</h2>${inE.length ? `<div class="pie"><img src="${donut(inE)}"><table>${table(inE, st.inn)}</table></div>` : '<p>Aucune entrée</p>'}</div>
      </div>
      ${rules.length ? `<h2>Règles</h2><table><tr><th>Catégorie</th><th>Règle</th><th class="r">Réalisé</th><th class="r">Statut</th></tr>${rules.map(x => `<tr><td>${esc(x.c.name)}</td><td>${x.label}</td><td class="r">${x.detail}</td><td class="r ${x.level === 'over' ? 'out' : x.level === 'ok' ? 'in' : ''}">${x.level === 'over' ? 'Dépassé' : x.level === 'warn' ? 'Alerte' : 'OK'}</td></tr>`).join('')}</table>` : ''}
      <h2>Transactions</h2>
      <table><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Étiquette</th><th class="r">Montant</th></tr>
        ${st.items.slice().reverse().map(t => `<tr><td>${fmtDate(t.date)}</td><td>${esc(t.desc)}${t.sub ? ' <small style="color:#2f7cf6">(mensualité)</small>' : ''}</td><td>${esc(catName(t.cat))}</td><td>${esc(tagNames(t))}</td><td class="r ${t.type}">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</td></tr>`).join('') || '<tr><td colspan="5">Aucune transaction</td></tr>'}
      </table>
      ${D.goals.length ? `<h2>Objectifs d'épargne</h2><table><tr><th>Objectif</th><th class="r">Épargné</th><th class="r">Visé</th><th class="r">Progression</th></tr>${D.goals.map(g => { const s = sumBy(g.moves); return `<tr><td>${esc(g.name)}</td><td class="r">${eur(s)}</td><td class="r">${eur(g.target)}</td><td class="r">${pct(s / g.target * 100, 0)}</td></tr>`; }).join('')}</table>` : ''}
      <div class="foot">Tmoney</div>
    </body></html>`;
    D.settings.discreet = discreet;
    const res = await api.exportPdf(html, `Tmoney-rapport-${r.start}_${r.end}.pdf`);
    if (res) toast('Rapport PDF enregistré');
  } finally { D.settings.discreet = discreet; }
}

// ================= Verrouillage automatique =================
let idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  const min = D.settings?.autoLock || 0;
  if (!min || $('#app').hidden) return;
  idleTimer = setTimeout(() => { if (!$('#app').hidden) lockApp(); }, min * 60000);
}

// ================= Synchronisation =================
let syncState = { busy: false, last: null, error: null, timer: null, pending: null };

// Donne un horodatage aux enregistrements qui n'en ont pas encore (données créées avant l'activation de la synchro)
function ensureStamps() {
  const now = Date.now();
  for (const key of Object.values(SYNC_ARRAYS)) for (const o of D[key]) if (!o.u) { o.u = now; markDirty(o.id); }
  if (!D.settings.u) { D.settings.u = now; markDirty('settings'); }
}

function markEverythingDirty() {
  ensureStamps();
  for (const key of Object.values(SYNC_ARRAYS)) for (const o of D[key]) markDirty(o.id);
  markDirty('settings');
  for (const id of Object.keys(D.tomb || {})) markDirty(id);
}

function collectRecords() {
  ensureStamps();
  const out = [];
  const ids = Object.keys(D.dirty || {});
  for (const id of ids) {
    if (id === 'settings') { out.push({ id, kind: 'settings', u: D.settings.u, deleted: false, data: { ...D.settings } }); continue; }
    const t = D.tomb?.[id];
    if (t) { out.push({ id, kind: t.kind, u: t.u, deleted: true, data: null }); continue; }
    for (const [kind, key] of Object.entries(SYNC_ARRAYS)) {
      const o = D[key].find(x => x.id === id);
      if (o) { out.push({ id, kind, u: o.u, deleted: false, data: o }); break; }
    }
  }
  return out;
}

function applyRemote(rows) {
  let changed = 0;
  for (const r of rows) {
    if (r.kind === 'settings') {
      if (r.data && (r.data.u || 0) > (D.settings.u || 0)) { D.settings = { ...D.settings, ...r.data }; changed++; }
      continue;
    }
    const key = SYNC_ARRAYS[r.kind];
    if (!key) continue;
    const arr = D[key], i = arr.findIndex(o => o.id === r.id);
    const localU = i >= 0 ? (arr[i].u || 0) : (D.tomb[r.id]?.u || 0);
    if (r.u <= localU) continue;
    if (r.deleted) {
      if (i >= 0) arr.splice(i, 1);
      D.tomb[r.id] = { u: r.u, kind: r.kind };
    } else {
      if (i >= 0) arr[i] = r.data; else arr.push(r.data);
      delete D.tomb[r.id];
    }
    delete D.dirty[r.id];
    changed++;
  }
  return changed;
}

const SUPABASE_SQL = `create table if not exists public.vault_meta (
  user_id uuid primary key references auth.users on delete cascade,
  salt text not null,
  wrapped_key text not null,
  recovery_wrapped text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.records (
  user_id uuid not null references auth.users on delete cascade,
  id text not null,
  kind text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  payload text,
  primary key (user_id, id)
);
create index if not exists records_user_updated on public.records (user_id, updated_at);

alter table public.vault_meta enable row level security;
alter table public.records enable row level security;

drop policy if exists vault_meta_own on public.vault_meta;
create policy vault_meta_own on public.vault_meta
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists records_own on public.records;
create policy records_own on public.records
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);`;
const serverHost = () => (D.server?.url || '').replace('https://', '').replace('.supabase.co', '');

function serverWizard() {
  let step = D.server ? 1 : 0;
  const draw = form => {
    const panes = $$('[data-step]', form);
    panes.forEach(p => { p.hidden = +p.dataset.step !== step; });
    $('[data-wizard-back]', form).hidden = step === 0;
    $('footer .btn.pri', form).textContent = step < 2 ? 'Continuer' : 'Tester et enregistrer';
  };
  modal({
    title: 'Configurer le serveur de synchronisation',
    submit: 'Continuer', cancel: true, wide: true,
    extraFooter: '<button type="button" class="btn" data-wizard-back>Retour</button>',
    body: `
      <div data-step="0">
        <p style="margin:0 0 12px">La synchronisation entre plusieurs PC passe par une base de données personnelle, gratuite, chez Supabase. Les données y sont déposées chiffrées : le service ne peut pas les lire.</p>
        <ol style="margin:0;padding-left:20px;line-height:1.9">
          <li>Créer un compte sur <a href="#" data-open="https://supabase.com">supabase.com</a> (bouton « Start your project »).</li>
          <li>Cliquer sur <b>New project</b>, nommer le projet <b>tmoney</b>, choisir une région en Europe, plan <b>Free</b>.</li>
          <li>Attendre la fin de la création (1 à 2 minutes).</li>
        </ol>
      </div>
      <div data-step="1" hidden>
        <p style="margin:0 0 12px">Dans le projet Supabase : menu <b>SQL Editor</b> → <b>New query</b>, coller le texte ci-dessous puis cliquer sur <b>Run</b>. Cela crée les deux tables nécessaires.</p>
        <button type="button" class="btn pri" data-copy-sql>Copier le SQL</button>
        <span class="mut" id="sqlCopied" style="margin-left:10px;font-size:12px"></span>
        <pre style="max-height:180px;overflow:auto;background:var(--card-2);border:1px solid var(--bd);border-radius:10px;padding:12px;font-size:11px;margin-top:12px">${esc(SUPABASE_SQL)}</pre>
        <p class="mut" style="margin:12px 0 0;font-size:12px">Ensuite : menu <b>Authentication</b> → <b>Sign In / Providers</b> → désactiver <b>Confirm email</b> et enregistrer.</p>
      </div>
      <div data-step="2" hidden>
        <p style="margin:0 0 12px">Dans le projet Supabase : <b>Project Settings</b> → <b>API Keys</b>.</p>
        <label class="f">Adresse du projet (Project URL)<input name="url" placeholder="https://xxxxxxxx.supabase.co" value="${esc(D.server?.url || '')}"></label>
        <label class="f">Clé publishable (ou anon public)<input name="key" placeholder="sb_publishable_..." value="${esc(D.server?.key || '')}"></label>
        <p class="mut" style="margin:0;font-size:12px">Ne jamais utiliser la clé <b>secret</b> ou <b>service_role</b>.</p>
      </div>`,
    onMount: form => {
      draw(form);
      $('[data-wizard-back]', form).onclick = () => { step--; draw(form); };
      $('[data-copy-sql]', form).onclick = async () => {
        try { await api.copyText(SUPABASE_SQL); $('#sqlCopied').textContent = 'Copié'; }
        catch { $('#sqlCopied').textContent = 'Copie impossible : sélectionner le texte ci-dessous'; }
      };
      $$('[data-open]', form).forEach(a => a.onclick = e => { e.preventDefault(); api.openExternal(a.dataset.open); });
      Object.defineProperty(form, '_next', { value: () => { step++; draw(form); } });
    },
    onSubmit: async form => {
      if (step < 2) { form._next(); return KEEP_OPEN; }
      const cfg = { url: form.url.value.trim().replace(/\/+$/, ''), key: form.key.value.trim() };
      const res = await api.syncTestServer(cfg);
      const err = res.ok ? res.data.error : 'other';
      if (err) return {
        url: "Adresse invalide : elle ressemble à https://xxxxxxxx.supabase.co",
        key: 'Clé refusée par le serveur : reprendre la clé publishable dans API Keys.',
        tables: 'Tables absentes : revenir à l\'étape précédente et exécuter le SQL dans le SQL Editor.',
        unreachable: 'Serveur injoignable : vérifier l\'adresse et la connexion internet.',
        other: 'Erreur : ' + (res.data?.detail || res.error || 'inconnue')
      }[err];
      D.server = cfg;
      await api.syncSetServer(cfg);
      await persist();
      renderSettings();
      toast('Serveur enregistré');
    }
  });
}

function syncBadge() {
  const b = $('#syncBadge');
  if (!b) return;
  const on = !!D.sync?.email;
  b.hidden = !on;
  if (!on) return;
  const state = syncState.busy ? 'busy' : syncState.error ? 'err' : '';
  b.className = 'sync-badge ' + state;
  b.innerHTML = `<i></i><span>${syncState.busy ? 'Synchronisation…' : syncState.error ? (syncState.error === 'hors ligne' ? 'Hors ligne' : 'Erreur de synchro') : 'Synchronisé'}</span>`;
  b.title = syncState.error ? syncState.error : syncState.last ? 'Dernière synchro : ' + new Date(syncState.last).toLocaleTimeString('fr-FR') : '';
}

function syncUi() {
  syncBadge();
  if (page !== 'settings') return;
  const acc = $('#syncAccount'), st = $('#syncState'), btns = $('#syncButtons'), now = $('#syncNow'), srv = $('#syncServer');
  if (!acc) return;
  const on = !!D.sync?.email, hasServer = !!D.server?.url;
  srv.textContent = hasServer ? serverHost() : 'Non configuré';
  acc.textContent = on ? D.sync.email : hasServer ? 'Non connecté' : 'Configurer d\'abord le serveur';
  now.hidden = !on;
  $('#syncWipeRow').hidden = !on;
  btns.innerHTML = on
    ? `<button class="btn" data-sync="out">Se déconnecter</button>`
    : hasServer
      ? `<button class="btn pri" data-sync="signup">Créer un compte</button><button class="btn" data-sync="signin">Se connecter</button>`
      : '';
  st.textContent = !on ? 'Synchronisation désactivée'
    : syncState.busy ? 'Synchronisation en cours…'
    : syncState.error ? `Erreur : ${syncState.error}`
    : syncState.last ? `À jour · dernière synchro à ${new Date(syncState.last).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : 'En attente';
}

async function syncNow(silent = true) {
  if (!D.sync?.email || syncState.busy) return;
  syncState.busy = true; syncState.error = null; syncUi();
  try {
    const since = D.sync.lastPull || null;
    const pulled = await api.syncPull(since);
    if (!pulled.ok) throw new Error(pulled.error);
    const changed = applyRemote(pulled.data);
    const toPush = collectRecords();
    if (toPush.length) {
      const pushed = await api.syncPush(toPush);
      if (!pushed.ok) throw new Error(pushed.error);
      // On ne déverrouille que ce qui n'a pas rebougé pendant l'envoi
      const after = new Map(collectRecords().map(r => [r.id, r.u]));
      for (const r of toPush) if (!after.has(r.id) || after.get(r.id) === r.u) delete D.dirty[r.id];
    }
    const maxU = pulled.data.reduce((a, r) => Math.max(a, r.u), 0);
    if (maxU) D.sync.lastPull = new Date(maxU - 60000).toISOString();
    syncState.last = Date.now();
    await persist();
    if (changed) render();
    if (!silent) toast(changed ? `Synchronisé · ${plural(changed, 'élément')} mis à jour` : 'Synchronisé');
  } catch (e) {
    const msg = String(e.message || e);
    syncState.error = msg === 'offline' ? 'hors ligne' : msg;
    if (!silent) toast('Synchronisation impossible : ' + syncState.error);
  } finally {
    syncState.busy = false; syncUi();
  }
}

const scheduleSync = () => {
  clearTimeout(syncState.pending);
  syncState.pending = setTimeout(() => syncNow(true), 3000);
};

function startSyncLoop() {
  clearInterval(syncState.timer);
  syncState.timer = setInterval(() => syncNow(true), 30000);
  window.addEventListener('focus', () => syncNow(true));
}

async function afterSignIn(res, extra) {
  D.sync = { email: res.email, mk: res.mk, session: res.session, lastPull: null };
  markEverythingDirty();
  await persist();
  await syncNow(false);
  startSyncLoop();
  renderSettings();
  if (extra) extra();
}

function syncAuthModal(mode) {
  const signup = mode === 'signup';
  modal({
    title: signup ? 'Créer un compte de synchronisation' : 'Connexion',
    submit: signup ? 'Créer le compte' : 'Se connecter',
    body: `<label class="f">Email<input name="email" type="email" autocomplete="off"></label>
      <label class="f">Mot de passe<input name="pwd" type="password" autocomplete="off"></label>
      ${signup ? `<label class="f">Confirmation<input name="pwd2" type="password" autocomplete="off"></label>
        <p class="mut" style="margin:0;font-size:12px">Ce mot de passe chiffre les données envoyées : il n'est jamais transmis au serveur. Une clé de secours sera affichée après la création.</p>`
        : `<p class="mut" style="margin:0;font-size:12px">Les données de ce PC seront fusionnées avec celles du compte.</p>
           <button type="button" class="btn sm" data-sync="recover">Mot de passe oublié</button>`}`,
    onSubmit: async form => {
      const email = form.email.value.trim(), pwd = form.pwd.value;
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Email invalide.';
      if (pwd.length < 8) return 'Mot de passe : 8 caractères minimum.';
      if (signup && pwd !== form.pwd2.value) return 'Les mots de passe ne correspondent pas.';
      await api.syncSetServer(D.server);
      const res = signup ? await api.syncSignUp(email, pwd) : await api.syncSignIn(email, pwd);
      if (!res.ok) return {
        'offline': 'Pas de connexion internet.',
        'no-server': 'Serveur non configuré.',
        'confirm-email': 'Compte créé : confirmer l\'email reçu, puis se connecter.',
        'no-vault': 'Compte sans données : créer le compte depuis le premier PC.',
        'bad-key': 'Mot de passe incorrect pour le déchiffrement.',
        'Invalid login credentials': 'Email ou mot de passe incorrect.',
        'User already registered': 'Un compte existe déjà avec cet email.'
      }[res.error] || ('Erreur : ' + res.error);
      await afterSignIn(res.data, signup ? () => showRecoveryKey(res.data.recoveryKey) : null);
      toast(signup ? 'Compte créé' : 'Connecté');
    }
  });
}

function showRecoveryKey(key) {
  modal({
    title: 'Clé de secours', submit: 'J\'ai noté la clé', cancel: false,
    body: `<p style="margin:0">Seul moyen de récupérer les données en ligne en cas de mot de passe oublié. Elle ne sera plus affichée.</p>
      <div class="pin" style="letter-spacing:2px;font-size:20px;user-select:all;background:var(--card-2);border:1px solid var(--bd);border-radius:10px;padding:14px">${esc(key)}</div>
      <p class="mut" style="margin:0;font-size:12px">À conserver hors de ce PC : gestionnaire de mots de passe, papier, autre appareil.</p>`,
    onSubmit: () => {}
  });
}

function syncRecoverModal() {
  modal({
    title: 'Mot de passe oublié', submit: 'Récupérer',
    body: `<p class="mut" style="margin:0;font-size:12px">Nécessite la clé de secours affichée à la création du compte, ainsi qu'un nouveau mot de passe défini depuis l'email de réinitialisation Supabase.</p>
      <label class="f">Email<input name="email" type="email"></label>
      <label class="f">Mot de passe actuel<input name="pwd" type="password"></label>
      <label class="f">Clé de secours<input name="rk" placeholder="XXXX-XXXX-XXXX-..."></label>
      <label class="f">Nouveau mot de passe (optionnel)<input name="newPwd" type="password"></label>`,
    onSubmit: async form => {
      const res = await api.syncRecover(form.email.value.trim(), form.pwd.value, form.rk.value.trim(), form.newPwd.value || null);
      if (!res.ok) return res.error === 'bad-recovery' ? 'Clé de secours incorrecte.' : 'Erreur : ' + res.error;
      await afterSignIn(res.data);
      toast('Accès récupéré');
    }
  });
}

// ================= Bienvenue =================
function welcome() {
  const w = $('#welcome'); w.hidden = false;
  const state = { step: 0, pin: '', cats: [], theme: 'dark' };
  const panel = $('#welcomePanel');
  const steps = () => `<div class="steps">${[0, 1, 2, 3].map(i => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const draw = () => {
    document.documentElement.dataset.theme = state.theme;
    if (state.step === 0) {
      panel.innerHTML = `${steps()}<div data-logo class="logo"></div><h1>Tmoney</h1>
        <p>Suivi des entrées, sorties, mensualités et objectifs d'épargne. Données stockées localement et chiffrées par code PIN.</p>
        <p>Configuration initiale : 3 étapes.</p>
        <div class="actions"><span></span><button class="btn pri" data-next>Commencer</button></div>`;
    } else if (state.step === 1) {
      panel.innerHTML = `${steps()}<h1>Code PIN</h1><p>4 à 6 chiffres, demandé à chaque ouverture.<br><b style="color:var(--warn)">PIN perdu = données irrécupérables.</b></p>
        <div class="row"><label class="f">Code PIN<input class="pin" id="wPin1" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></label>
        <label class="f">Confirmation<input class="pin" id="wPin2" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></label></div>
        <div class="err" id="wErr"></div>
        <div class="actions"><button class="btn" data-back>Retour</button><button class="btn pri" data-next>Continuer</button></div>`;
      setTimeout(() => $('#wPin1').focus(), 30);
    } else if (state.step === 2) {
      panel.innerHTML = `${steps()}<h1>Catégories</h1><p>Catégories de sorties et d'entrées. Modifiables ultérieurement.</p>
        <form class="row" id="wCatForm">
          <label class="f">Nom<input id="wCatName"></label>
          <label class="f auto">Type<select id="wCatType" style="width:130px"><option value="out">Sortie</option><option value="in">Entrée</option></select></label>
          <label class="f auto">Couleur<input id="wCatColor" type="color" value="${PALETTE[state.cats.length % PALETTE.length]}" style="width:54px;height:40px;padding:3px"></label>
          <button class="btn">${ic('plus')}Ajouter</button>
        </form>
        <div class="err" id="wErr"></div>
        <div class="grid g2" style="margin-top:6px">
          ${['out', 'in'].map(t => `<div class="card" style="padding:14px"><h3>${t === 'out' ? 'Sorties' : 'Entrées'}</h3>
            ${state.cats.filter(c => c.type === t).map(c => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><i class="dot" style="background:${c.color}"></i><span style="flex:1">${esc(c.name)}</span><button class="icon-btn del" data-wdel="${c.id}">${ic('x')}</button></div>`).join('') || '<div class="mut" style="font-size:13px">–</div>'}
          </div>`).join('')}
        </div>
        <div class="actions"><button class="btn" data-back>Retour</button><button class="btn pri" data-next>${state.cats.length ? 'Continuer' : 'Ignorer'}</button></div>`;
      $('#wCatForm').onsubmit = e => {
        e.preventDefault();
        const name = $('#wCatName').value.trim(), type = $('#wCatType').value;
        if (!name) return;
        if (state.cats.some(c => c.type === type && c.name.toLowerCase() === name.toLowerCase())) { $('#wErr').textContent = 'Catégorie déjà existante.'; return; }
        state.cats.push({ id: uid(), name, type, color: $('#wCatColor').value, rules: [] });
        draw();
        $('#wCatType').value = type; $('#wCatName').focus();
      };
      setTimeout(() => $('#wCatName')?.focus(), 30);
    } else {
      panel.innerHTML = `${steps()}<h1>Thème</h1><p>Modifiable dans les réglages.</p>
        <div class="theme-pick">
          ${[['light', 'Clair', '#f3f6fb', '#ffffff', '#dfe5ef'], ['dark', 'Sombre', '#0b1120', '#0e1628', '#223049']].map(([v, l, bg, side, bd]) => `<button data-theme-v="${v}" class="${state.theme === v ? 'on' : ''}">
            <div class="theme-prev" style="background:${bg};border:1px solid ${bd}"><div style="background:${side};border-right:1px solid ${bd}"></div><div style="padding:10px;display:grid;gap:6px"><div style="height:14px;width:60%;border-radius:4px;background:#2f7cf6"></div><div style="height:30px;border-radius:6px;background:${side};border:1px solid ${bd}"></div></div></div><b>${l}</b></button>`).join('')}
        </div>
        <div class="err" id="wErr"></div>
        <div class="actions"><button class="btn" data-back>Retour</button><button class="btn pri" data-finish>Terminer</button></div>`;
    }
    paintIcons(panel);
  };
  panel.onclick = async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.wdel) { state.cats = state.cats.filter(c => c.id !== t.dataset.wdel); draw(); return; }
    if (t.dataset.themeV) { state.theme = t.dataset.themeV; draw(); return; }
    if ('back' in t.dataset) { state.step--; draw(); return; }
    if ('next' in t.dataset) {
      if (state.step === 1) {
        const a = $('#wPin1').value, b = $('#wPin2').value;
        if (!/^\d{4,6}$/.test(a)) { $('#wErr').textContent = 'PIN : 4 à 6 chiffres.'; return; }
        if (a !== b) { $('#wErr').textContent = 'Les codes ne correspondent pas.'; return; }
        state.pin = a;
      }
      state.step++; draw(); return;
    }
    if ('finish' in t.dataset) {
      t.disabled = true; t.textContent = 'Création…';
      D = emptyData(); D.cats = state.cats; D.settings.theme = state.theme;
      try { await api.create(state.pin, D); } catch (err) { $('#wErr').textContent = 'Erreur : ' + err.message; t.disabled = false; t.textContent = 'Terminer'; return; }
      w.hidden = true; startApp();
    }
  };
  panel.onkeydown = e => { if (e.key === 'Enter' && state.step === 1) { e.preventDefault(); $('[data-next]', panel).click(); } };
  draw();
}

// ================= Verrouillage =================
function showLock() {
  $('#app').hidden = true;
  $('#lockScreen').hidden = false;
  $('#unlockPin').value = ''; $('#unlockErr').textContent = '';
  setTimeout(() => $('#unlockPin').focus(), 30);
}
$('#unlockForm').onsubmit = async e => {
  e.preventDefault();
  const pin = $('#unlockPin').value;
  if (!/^\d{4,6}$/.test(pin)) { $('#unlockErr').textContent = 'PIN : 4 à 6 chiffres.'; return; }
  $('#unlockErr').textContent = 'Vérification…';
  const r = await api.unlock(pin);
  if (r.data) {
    const base = emptyData();
    D = migrate({ ...base, ...r.data, settings: { ...base.settings, ...(r.data.settings || {}) } });
    $('#lockScreen').hidden = true;
    startApp();
  } else {
    $('#unlockPin').value = '';
    $('#unlockErr').textContent = r.error === 'wait' ? `Trop de tentatives. Réessayer dans ${r.seconds} s.`
      : r.error === 'other-device' ? 'Coffre créé sur un autre ordinateur : illisible ici. Utiliser « Code PIN oublié », puis se reconnecter à la synchronisation.'
      : `PIN incorrect. ${plural(r.left, 'essai')} restant${r.left > 1 ? 's' : ''}.`;
    $('#unlockPin').focus();
  }
};
$('#forgotPin').onclick = async () => { if (await api.reset()) { $('#lockScreen').hidden = true; welcome(); } };
async function lockApp() {
  await persist(); await api.lock();
  $$('.modal-bg').forEach(m => m.remove());
  Object.values(charts).forEach(c => c.destroy());
  editing = false;
  clearInterval(syncState.timer); clearTimeout(syncState.pending);
  await api.syncSignOut();
  D = emptyData(); showLock();
}

function changePinModal() {
  modal({
    title: 'Modifier le code PIN', submit: 'Valider',
    body: `<label class="f">PIN actuel<input name="old" class="pin" type="password" inputmode="numeric" maxlength="6"></label>
      <div class="row"><label class="f">Nouveau PIN<input name="n1" class="pin" type="password" inputmode="numeric" maxlength="6"></label>
      <label class="f">Confirmation<input name="n2" class="pin" type="password" inputmode="numeric" maxlength="6"></label></div>`,
    onSubmit: async form => {
      if (!/^\d{4,6}$/.test(form.n1.value)) return 'PIN : 4 à 6 chiffres.';
      if (form.n1.value !== form.n2.value) return 'Les codes ne correspondent pas.';
      if (!(await api.changePin(form.old.value, form.n1.value, D))) return 'PIN actuel incorrect.';
      toast('PIN modifié');
    }
  });
}

// ================= Démarrage =================
let bound = false;
async function startApp() {
  $('#app').hidden = false;
  R = makeRange('month', todayStr());
  if (!bound) bindEvents();
  go('dashboard');
  resetIdle();
  if (D.server?.url) await api.syncSetServer(D.server);
  if (D.server?.url && D.sync?.session && await api.syncRestore(D.sync)) { startSyncLoop(); syncNow(true); }
}

function bindEvents() {
  bound = true;
  $$('#nav button[data-page]').forEach(b => b.onclick = () => go(b.dataset.page));
  $$('#periodKind button').forEach(b => b.onclick = () => {
    const k = b.dataset.v;
    if (k === 'custom') R = { kind: 'custom', start: R.start, end: R.end };
    else { const t = todayStr(); R = makeRange(k, t >= R.start && t <= R.end ? t : R.start); }
    render();
  });
  $('#prevPeriod').onclick = () => { R = shiftRange(R, -1); render(); };
  $('#nextPeriod').onclick = () => { R = shiftRange(R, 1); render(); };
  $('#todayBtn').onclick = () => { R = R.kind === 'custom' ? makeRange('month', todayStr()) : makeRange(R.kind, todayStr()); render(); };
  const onCustom = () => {
    const s = $('#cStart').value, e = $('#cEnd').value;
    if (!s || !e) return;
    R = { kind: 'custom', start: s <= e ? s : e, end: s <= e ? e : s };
    render();
  };
  $('#cStart').onchange = onCustom; $('#cEnd').onchange = onCustom;
  $('#editLayout').onclick = () => setEditing(!editing);
  $('#doneLayout').onclick = () => setEditing(false);
  $('#addChart').onclick = () => chartModal();
  $('#resetLayout').onclick = () => { D.settings.layout = defaultLayout(); stampSettings(); persist(); renderDashboard(); };
  bindLayoutDnd();
  $('#quickAdd').onclick = () => ({ subs: () => subModal(), cats: () => catModal(), goals: () => goalModal() }[page] || (() => txModal(null, txType === 'in' ? 'in' : 'out')))();
  $('#themeToggle').onclick = () => { D.settings.theme = D.settings.theme === 'dark' ? 'light' : 'dark'; stampSettings(); persist(); render(); };
  $('#discreetToggle').onclick = () => { D.settings.discreet = !D.settings.discreet; stampSettings(); persist(); render(); };
  $$('#setTheme button').forEach(b => b.onclick = () => { D.settings.theme = b.dataset.v; stampSettings(); persist(); render(); });
  $$('#setDiscreet button').forEach(b => b.onclick = () => { D.settings.discreet = b.dataset.v === 'on'; stampSettings(); persist(); render(); });
  $('#lockBtn').onclick = lockApp; $('#lockBtn2').onclick = lockApp;
  $('#autoLock').onchange = e => { D.settings.autoLock = +e.target.value; stampSettings(); persist(); resetIdle(); };
  ['mousemove', 'keydown', 'click', 'wheel'].forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
  $('#changePinBtn').onclick = changePinModal;
  $('#expXlsx').onclick = exportXlsx;
  $('#expPdf').onclick = exportPdf;
  $('#impXlsx').onclick = importXlsx;
  $('#openSave').onclick = () => {
    const raw = $('#openAmount').value.trim();
    const a = raw === '' ? 0 : parseAmount(raw);
    if (!isFinite(a)) { $('#openErr').textContent = 'Montant invalide.'; return; }
    D.settings.opening = { amount: a, date: $('#openDate').value || '' };
    stampSettings();
    $('#openErr').textContent = '';
    persist(); render(); toast('Solde de départ enregistré');
  };
  const UPD = {
    checking: () => 'Recherche en cours…',
    none: () => 'Application à jour',
    available: i => `Version ${i.version} disponible, téléchargement…`,
    downloading: i => `Téléchargement : ${i.percent} %`,
    downloaded: i => `Version ${i.version} téléchargée`,
    manual: i => `Version ${i.version} disponible`,
    error: i => `Erreur : ${i.message}`
  };
  api.onUpdate(({ status, info }) => {
    const el = $('#updDetail');
    if (el) el.textContent = (UPD[status] || (() => status))(info || {});
    $('#updInstallRow').hidden = status !== 'downloaded' && status !== 'manual';
    if (status === 'downloaded') toast('Mise à jour prête à installer');
    if (status === 'manual') {
      $('#updInstallRow small').textContent = "Télécharger le nouveau .dmg et remplacer l'application";
      $('#updInstall').textContent = 'Télécharger';
      toast('Nouvelle version disponible');
    }
  });
  $('#updCheck').onclick = async () => {
    $('#updDetail').textContent = 'Recherche en cours…';
    const r = await api.checkUpdate();
    if (!r.configured) $('#updDetail').textContent = 'Mises à jour non configurées (dépôt GitHub à renseigner)';
    else if (r.dev) $('#updDetail').textContent = 'Mode développement : mises à jour inactives';
  };
  $('#updInstall').onclick = () => api.installUpdate();
  $('#syncNow').onclick = () => syncNow(false);
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-sync]');
    if (!b) return;
    const a = b.dataset.sync;
    if (a === 'server') serverWizard();
    else if (a === 'signup' || a === 'signin') syncAuthModal(a);
    else if (a === 'recover') { $$('.modal-bg').forEach(x => x.remove()); syncRecoverModal(); }
    else if (a === 'wipe') {
      if (!await confirmModal('Effacer les données en ligne', 'Toutes les lignes envoyées au serveur seront supprimées définitivement.<br><br>Les données de ce PC sont conservées, mais les autres PC ne recevront plus rien tant que ce PC n\'aura pas tout renvoyé.', 'Effacer')) return;
      const res = await api.syncWipe();
      if (!res.ok) { toast('Échec : ' + res.error); return; }
      D.sync.lastPull = null;
      await persist(true);
      toast('Données en ligne effacées');
      renderSettings();
    }
    else if (a === 'wipeall') {
      const total = D.tx.length + D.cats.length + D.subs.length + D.goals.length;
      let ok = false;
      modal({
        title: 'Tout effacer', submit: 'Tout effacer', danger: true,
        body: `<p style="margin:0">Suppression définitive de <b>${plural(total, 'élément')}</b> : transactions, catégories, mensualités et objectifs.</p>
          <p style="margin:0">L'effacement est envoyé ${D.sync?.email ? 'au serveur et à tous les PC connectés au compte, même éteints aujourd\'hui' : 'sur ce PC uniquement (synchronisation désactivée)'}.</p>
          <p class="mut" style="margin:0;font-size:13px">Les réglages, le code PIN et le compte de synchronisation sont conservés.</p>
          <label class="f">Taper EFFACER pour confirmer<input name="confirm" autocomplete="off"></label>`,
        onSubmit: async form => {
          if (form.confirm.value.trim().toUpperCase() !== 'EFFACER') return 'Saisir EFFACER pour confirmer.';
          for (const [kind, key] of Object.entries(SYNC_ARRAYS)) {
            for (const o of D[key]) markDeleted(o.id, kind);
            D[key] = [];
          }
          ok = true;
          await persist(true);
          render();
        }
      });
      const wait = setInterval(async () => {
        if (document.querySelector('.modal-bg')) return;
        clearInterval(wait);
        if (!ok) return;
        if (D.sync?.email) await syncNow(false);
        toast('Toutes les données ont été effacées');
      }, 300);
    }
    else if (a === 'out') {
      if (!await confirmModal('Se déconnecter', 'Les données restent sur ce PC. La synchronisation sera arrêtée.', 'Se déconnecter')) return;
      await api.syncSignOut();
      D.sync = null; clearInterval(syncState.timer);
      persist(); renderSettings();
    }
  });
  $('#txSearch').oninput = renderTransactions;
  $('#txScope').onchange = renderTransactions;
  $('#txFilterCat').onchange = renderTransactions;
  $$('#txFilterType button').forEach(b => b.onclick = () => { txType = b.dataset.v; $$('#txFilterType button').forEach(x => x.classList.toggle('on', x === b)); renderTransactions(); });

  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-edit-chart],[data-del-chart],[data-toggle-block],[data-cat-detail],[data-new-cat],[data-edit-tx],[data-del-tx],[data-edit-sub],[data-del-sub],[data-toggle-sub],[data-edit-cat],[data-del-cat],[data-edit-goal],[data-del-goal],[data-goal-move]');
    if (!el || $('#app').hidden) return;
    const d = el.dataset;
    if (d.editChart) chartModal(customCharts().find(c => c.id === d.editChart));
    else if (d.delChart) {
      const c = customCharts().find(x => x.id === d.delChart);
      if (await confirmModal('Supprimer le graphique', `Suppression du graphique « ${esc(c.title)} ».`)) {
        D.settings.charts = customCharts().filter(x => x.id !== c.id);
        D.settings.layout = layout().filter(b => b.id !== c.id);
        stampSettings(); persist(); renderDashboard();
      }
    }
    else if (d.toggleBlock) {
      const L = layout(), b = L.find(x => x.id === d.toggleBlock); b.hidden = !b.hidden;
      D.settings.layout = L; stampSettings(); persist(); renderDashboard();
    }
    else if (d.catDetail) { if (!editing) catDetail(d.catDetail); }
    else if (d.newCat) { e.preventDefault(); catModal(null, d.newCat); }
    else if (d.editTx) txModal(D.tx.find(t => t.id === d.editTx));
    else if (d.delTx) {
      const item = D.tx.find(t => t.id === d.delTx);
      if (await confirmModal('Supprimer la transaction', 'Suppression définitive de cette transaction.')) {
        markDeleted(d.delTx, 'tx'); D.tx = D.tx.filter(t => t.id !== d.delTx); persist(); render();
        toast('Transaction supprimée', () => { delete D.tomb[item.id]; D.tx.push(stamp(item)); persist(); render(); });
      }
    }
    else if (d.editSub) subModal(D.subs.find(s => s.id === d.editSub));
    else if (d.delSub) {
      const item = D.subs.find(x => x.id === d.delSub);
      if (await confirmModal('Supprimer la mensualité', 'La mensualité sera retirée de tous les mois, y compris passés.<br><br>Pour conserver l\'historique : utiliser « Arrêter ».')) {
        markDeleted(d.delSub, 'sub'); D.subs = D.subs.filter(s => s.id !== d.delSub); persist(); render();
        toast('Mensualité supprimée', () => { delete D.tomb[item.id]; D.subs.push(stamp(item)); persist(); render(); });
      }
    }
    else if (d.toggleSub) {
      // Arrêter : comptée jusqu'au mois précédent (historique conservé). Reprendre : plus de date de fin.
      const s = D.subs.find(x => x.id === d.toggleSub), m = thisMonth();
      s.end = subActiveIn(s, m) ? shiftMonth(m, -1) : '';
      stamp(s);
      persist(); render();
    }
    else if (d.editCat) catModal(cat(d.editCat));
    else if (d.delCat) {
      const used = D.tx.filter(t => t.cat === d.delCat || tagsOf(t).includes(d.delCat)).length + D.subs.filter(s => s.versions.some(v => v.cat === d.delCat || tagsOf(v).includes(d.delCat))).length;
      if (used) { modal({ title: 'Suppression impossible', body: `<p style="margin:0">« ${esc(catName(d.delCat))} » est utilisée par ${plural(used, 'élément')} (transactions ou mensualités).</p>`, submit: 'OK', cancel: false, onSubmit: () => {} }); return; }
      if (await confirmModal('Supprimer la catégorie', `Suppression de « ${esc(catName(d.delCat))} ».`)) { markDeleted(d.delCat, 'cat'); D.cats = D.cats.filter(c => c.id !== d.delCat); persist(); render(); }
    }
    else if (d.editGoal) goalModal(D.goals.find(g => g.id === d.editGoal));
    else if (d.delGoal) {
      const item = D.goals.find(g => g.id === d.delGoal);
      if (await confirmModal("Supprimer l'objectif", "Suppression de l'objectif et de son historique.")) {
        markDeleted(d.delGoal, 'goal'); D.goals = D.goals.filter(g => g.id !== d.delGoal); persist(); render();
        toast('Objectif supprimé', () => { delete D.tomb[item.id]; D.goals.push(stamp(item)); persist(); render(); });
      }
    }
    else if (d.goalMove) goalMoveModal(D.goals.find(g => g.id === d.goalMove), +d.dir);
  });

  document.addEventListener('keydown', e => {
    if ($('#app').hidden || $('.modal-bg')) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === 'n') { e.preventDefault(); $('#quickAdd').click(); }
    if (mod && k === 'f') { e.preventDefault(); go('transactions'); $('#txScope').value = 'all'; renderTransactions(); $('#txSearch').focus(); }
    if (mod && k === 'd') { e.preventDefault(); $('#discreetToggle').click(); }
  });
}

(async function init() {
  paintIcons();
  if (await api.exists()) showLock(); else welcome();
})();
