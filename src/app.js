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
  play: '<path d="m6 3 14 9-14 9z"/>'
};
const ic = (n, style = '') => `<svg class="i" viewBox="0 0 24 24" ${style ? `style="${style}"` : ''}>${ICONS[n] || ''}</svg>`;
let logoN = 0; // dégradés à identifiant unique : un dégradé défini dans un élément masqué ne s'affiche pas ailleurs
const logo = () => { const a = 'lga' + (++logoN), b = 'lgb' + logoN; return `<svg viewBox="0 0 512 512" width="100%" height="100%"><defs><linearGradient id="${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9dff"/><stop offset="1" stop-color="#1d4fb8"/></linearGradient><linearGradient id="${b}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4fb8"/><stop offset="1" stop-color="#6aa8ff"/></linearGradient></defs><circle cx="256" cy="256" r="240" fill="url(#${a})"/><circle cx="256" cy="256" r="196" fill="url(#${b})"/><circle cx="256" cy="256" r="184" fill="url(#${a})"/><path d="M150 160h212v50h-80v150h-52V210h-80z" fill="#fff"/></svg>`; };
function paintIcons(root = document) {
  $$('[data-i]', root).forEach(el => { el.outerHTML = ic(el.dataset.i); });
  $$('[data-logo]', root).forEach(el => { el.innerHTML = logo(); });
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ================= Données =================
const emptyData = () => ({ version: 2, settings: { theme: 'dark', discreet: false, serial: false, layout: null }, cats: [], tx: [], subs: [], goals: [] });
let D = emptyData();
let page = 'dashboard';

async function persist() {
  try { await api.save(D); } catch (e) { toast('Erreur de sauvegarde : ' + e.message); }
}
const cat = id => D.cats.find(c => c.id === id);
const catsOf = type => D.cats.filter(c => c.type === type).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
const catName = id => cat(id)?.name || 'Sans catégorie';
const catColor = id => cat(id)?.color || '#94a3b8';
const subActiveIn = (s, m) => s.start <= m && (!s.end || s.end >= m);
const signOf = t => (t.type === 'in' ? t.amount : -t.amount);

// Transactions + occurrences des mensualités entre deux dates (incluses)
function itemsIn(start, end) {
  const items = D.tx.filter(t => t.date >= start && t.date <= end);
  for (const s of D.subs) {
    let m = s.start > start.slice(0, 7) ? s.start : start.slice(0, 7);
    const last = s.end && s.end < end.slice(0, 7) ? s.end : end.slice(0, 7);
    for (; m <= last; m = shiftMonth(m, 1)) {
      const date = `${m}-${pad(Math.min(s.day, daysIn(m)))}`;
      if (date < start || date > end) continue;
      items.push({ id: 'sub-' + s.id + '-' + m, subId: s.id, type: s.type, amount: s.amount, cat: s.cat, tag: s.tag, date, desc: s.name, notes: s.notes || '', sub: true });
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
}
const monthItems = m => itemsIn(`${m}-01`, `${m}-${daysIn(m)}`);
const firstDate = () => [...D.tx.map(t => t.date), ...D.subs.map(s => s.start + '-01')].sort()[0] || todayStr();
const balanceAt = date => sumBy(itemsIn('0000-01-01', date), signOf);

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
  const inn = sumBy(ins), out = sumBy(outs), fixedOut = sumBy(outs.filter(t => t.sub));
  let savings = 0;
  for (const g of D.goals) for (const mv of g.moves) if (mv.date >= r.start && mv.date <= r.end) savings += mv.amount;
  return {
    r, items, ins, outs, inn, out, net: inn - out, fixedOut, varOut: out - fixedOut, savings,
    byCatOut: group(outs, 'cat'), byCatIn: group(ins, 'cat'), byTagOut: group(outs, 'tag')
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
  ({ dashboard: renderDashboard, transactions: renderTransactions, subs: renderSubs, cats: renderCats, goals: renderGoals, settings: () => {} })[page]();
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
const defaultLayout = () => Object.keys(BLOCKS).map(id => ({ id, hidden: false }));
function layout() {
  const saved = (D.settings.layout || []).filter(b => BLOCKS[b.id]);
  for (const id of Object.keys(BLOCKS)) if (!saved.some(b => b.id === id)) saved.push({ id, hidden: false });
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

function pieBlock(id, sub, entries, centerLabel, after) {
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
  return cardHtml(BLOCKS[id].title, sub, body);
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
    const def = BLOCKS[b.id];
    const inner = b.hidden ? `<div class="card off-card">${def.title}</div>` : B[b.id]();
    const bar = editing ? `<div class="edit-bar">${ic('grip')}${def.title}<button data-toggle-block="${b.id}" title="${b.hidden ? 'Afficher' : 'Masquer'}">${ic(b.hidden ? 'eyeOff' : 'eye')}</button></div>` : '';
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
    persist(); renderDashboard();
  });
  grid.addEventListener('dragend', () => { dragId = null; clear(); });
}

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
    (!fc || t.cat === fc || t.tag === fc) &&
    (!q || [t.desc, t.notes, catName(t.cat), t.tag ? catName(t.tag) : ''].some(s => (s || '').toLowerCase().includes(q)) || (isFinite(qNum) && qNum > 0 && Math.abs(t.amount - qNum) < 0.005)));
  const inn = sumBy(list.filter(t => t.type === 'in')), out = sumBy(list.filter(t => t.type === 'out'));
  $('#txTotals').innerHTML = `<span>Entrées <b class="in">${eur(inn)}</b></span><span>Sorties <b class="out">${eur(out)}</b></span><span>${plural(list.length, 'ligne')}</span>`;
  const shown = list.slice(0, 1000);
  $('#txTable').innerHTML = list.length
    ? `<thead><tr><th style="width:100px">Date</th><th>Description</th><th>Catégorie</th><th>Étiquette</th><th class="r">Montant</th><th style="width:90px"></th></tr></thead><tbody>` +
      shown.map(t => `<tr>
        <td class="num mut">${fmtDate(t.date)}</td>
        <td class="cell-desc"><b>${esc(t.desc) || '<span class="mut">–</span>'}</b> ${t.sub ? '<span class="badge">Mensualité</span>' : ''}${t.notes ? `<small title="${esc(t.notes)}">${esc(t.notes)}</small>` : ''}</td>
        <td><span class="clickable" data-cat-detail="${t.cat}">${catTag(t.cat)}</span></td>
        <td>${t.tag ? `<span class="clickable" data-cat-detail="${t.tag}">${catTag(t.tag, true)}</span>` : '<span class="mut">–</span>'}</td>
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
  const active = D.subs.filter(s => subActiveIn(s, m));
  const aOut = active.filter(s => s.type === 'out'), aIn = active.filter(s => s.type === 'in');
  const outT = sumBy(aOut), inT = sumBy(aIn);
  $('#subKpis').innerHTML = [
    ['Sorties fixes / mois', eur(outT), plural(aOut.length, 'active'), 'out'],
    ['Sorties fixes / an', eur(outT * 12), 'projection', ''],
    ['Entrées fixes / mois', eur(inT), plural(aIn.length, 'active'), 'in'],
    ['Part des entrées', pct(st.inn ? outT / st.inn * 100 : 0), monthLabel(m), '']
  ].map(([l, v, s, c]) => `<div class="card kpi"><div class="lbl">${l}</div><div class="val ${c}">${v}</div><div class="sub">${s}</div></div>`).join('');
  const table = type => {
    const list = D.subs.filter(s => s.type === type).sort((a, b) => b.amount - a.amount);
    if (!list.length) return `<tr><td class="empty">Aucune mensualité</td></tr>`;
    const tot = sumBy(list.filter(s => subActiveIn(s, m)));
    return `<thead><tr><th>Nom</th><th>Catégorie</th><th>Étiquette</th><th>Jour</th><th>Statut</th><th class="r">Montant</th><th class="r">Par an</th><th class="r">Part</th><th style="width:120px"></th></tr></thead><tbody>` +
      list.map(s => {
        const on = subActiveIn(s, m);
        const status = !on && s.start > m ? `<span class="badge grey">Début ${monthShort(s.start)}</span>`
          : on ? (s.end ? `<span class="badge">Fin ${monthShort(s.end)}</span>` : '<span class="badge">Active</span>')
          : `<span class="badge grey">Arrêtée</span>`;
        return `<tr style="${on ? '' : 'opacity:.55'}">
          <td class="cell-desc"><b>${esc(s.name)}</b>${s.notes ? `<small>${esc(s.notes)}</small>` : ''}</td>
          <td>${catTag(s.cat)}</td><td>${s.tag ? catTag(s.tag, true) : '<span class="mut">–</span>'}</td>
          <td class="mut">${s.day}</td><td>${status}</td>
          <td class="r num ${type}" style="font-weight:600">${eur(s.amount)}</td>
          <td class="r num mut">${eur(s.amount * 12)}</td>
          <td class="r num mut">${on && tot ? pct(s.amount / tot * 100) : '–'}</td>
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
  st.items.forEach(t => { if (t.tag) byTagAll.set(t.tag, (byTagAll.get(t.tag) || 0) + t.amount); });
  const card = c => {
    const total = (c.type === 'out' ? st.byCatOut : byCatIn).get(c.id) || 0;
    const base = c.type === 'out' ? st.out : st.inn;
    const tagged = byTagAll.get(c.id) || 0;
    const rules = c.type === 'out' ? ruleStatus(c, st) : [];
    return `<div class="card cat-card">
      <div class="cat-head clickable" data-cat-detail="${c.id}" title="Détail"><div class="sw" style="background:${c.color}">${esc(c.name.slice(0, 1).toUpperCase())}</div>
        <div><div class="nm">${esc(c.name)}</div><div class="mut" style="font-size:12px">${base ? pct(total / base * 100) : '0 %'} des ${c.type === 'out' ? 'sorties' : 'entrées'}${tagged ? ` · étiquette : ${eur(tagged)}` : ''}</div></div>
        <div class="am"><div class="num ${c.type}" style="font-weight:700">${eur(total)}</div></div>
      </div>
      ${rules.length ? rules.map(rs => `<div class="rule"><div class="top"><span>${rs.label}</span><span>${rs.detail}</span></div><div class="prog ${rs.level}"><i style="width:${Math.min(100, rs.ratio * 100)}%"></i></div></div>`).join('') : c.type === 'out' ? '<div class="mut" style="font-size:12px">Aucune règle</div>' : ''}
      <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:auto">
        <button class="btn sm" data-edit-cat="${c.id}">${ic('edit')}Modifier</button>
        <button class="btn sm danger" data-del-cat="${c.id}">${ic('trash')}</button>
      </div></div>`;
  };
  const empty = t => `<div class="card empty" style="grid-column:1/-1">Aucune catégorie. <a href="#" data-new-cat="${t}">Créer</a></div>`;
  $('#catsOut').innerHTML = catsOf('out').map(card).join('') || empty('out');
  $('#catsIn').innerHTML = catsOf('in').map(card).join('') || empty('in');
}

function catDetail(id) {
  const c = cat(id); if (!c) return;
  const endM = R.end.slice(0, 7), months = [...Array(12)].map((_, i) => shiftMonth(endM, i - 11));
  const series = months.map(m => { const it = monthItems(m); return { main: sumBy(it.filter(t => t.cat === id)), tag: sumBy(it.filter(t => t.tag === id)) }; });
  const history = itemsIn('0000-01-01', [todayStr(), ...D.tx.map(t => t.date)].sort().pop()).filter(t => t.cat === id || t.tag === id);
  const total12 = sumBy(series, s => s.main), activeMonths = series.filter(s => s.main > 0).length;
  const st = stats(R), rules = c.type === 'out' ? ruleStatus(c, st) : [];
  const periodTotal = (c.type === 'out' ? st.byCatOut : st.byCatIn).get(id) || 0;
  const maxM = series.reduce((a, s, i) => (s.main > series[a].main ? i : a), 0);
  modal({
    title: `${esc(c.name)} <span class="badge grey" style="margin-left:8px">${c.type === 'out' ? 'Sortie' : 'Entrée'}</span>`,
    wide: true, cancel: false, submit: 'Fermer',
    body: `<div class="grid g4">
        ${[['Période affichée', eur(periodTotal), rangeLabel(R)], ['Total 12 mois', eur(total12), `${monthShort(months[0])} – ${monthShort(endM)}`], ['Moyenne / mois', eur(total12 / 12), activeMonths ? `${plural(activeMonths, 'mois')} actifs` : '–'], ['Mois le plus élevé', series[maxM].main ? eur(series[maxM].main) : '–', series[maxM].main ? monthLabel(months[maxM]) : '–']]
          .map(([l, v, s]) => `<div class="card stat"><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${s}</div></div>`).join('')}
      </div>
      <div class="card"><h3>12 mois</h3><div class="chart-box sm"><canvas id="ch-catdetail"></canvas></div></div>
      ${rules.length ? `<div class="card"><h3>Règles <span class="mut">${esc(rangeLabel(R))}</span></h3>${rules.map(rs => `<div class="rule"><div class="top"><span>${rs.label}</span><span>${rs.detail}</span></div><div class="prog ${rs.level}"><i style="width:${Math.min(100, rs.ratio * 100)}%"></i></div></div>`).join('')}</div>` : ''}
      <div class="card"><h3>Historique <span class="mut">${plural(history.length, 'transaction')}</span></h3>
        <div class="table-wrap" style="max-height:320px;overflow-y:auto"><table><tbody>
        ${history.slice(0, 500).map(t => `<tr><td class="num mut" style="width:100px">${fmtDate(t.date)}</td><td class="cell-desc"><b>${esc(t.desc) || '–'}</b> ${t.sub ? '<span class="badge">Mensualité</span>' : ''} ${t.tag === id ? '<span class="badge grey">Étiquette</span>' : ''}${t.notes ? `<small>${esc(t.notes)}</small>` : ''}</td><td>${t.tag === id ? catTag(t.cat) : t.tag ? catTag(t.tag, true) : ''}</td><td class="r num ${t.type}" style="font-weight:600">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</td></tr>`).join('') || '<tr><td class="empty">Aucune transaction</td></tr>'}
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
const tagOptions = selected => `<option value="">Aucune</option>` +
  ['out', 'in'].map(t => catsOf(t).length ? `<optgroup label="${t === 'out' ? 'Sorties' : 'Entrées'}">${catsOf(t).map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>` : '').join('');
const typeSeg = type => `<div class="seg type" data-type-seg style="align-self:flex-start"><button type="button" data-v="out" class="${type === 'out' ? 'on' : ''}">Sortie</button><button type="button" data-v="in" class="${type === 'in' ? 'on' : ''}">Entrée</button></div>`;
function bindTypeSeg(form, onChange) {
  $$('[data-type-seg] button', form).forEach(b => b.onclick = () => {
    $$('[data-type-seg] button', form).forEach(x => x.classList.toggle('on', x === b));
    onChange(b.dataset.v);
  });
}
const segVal = form => $('[data-type-seg] button.on', form).dataset.v;
const NO_CAT = 'Aucune catégorie de ce type. Créer une catégorie dans Catégories.';

function txModal(existing, presetType) {
  const t = existing || { type: presetType || 'out', amount: '', date: todayStr() >= R.start && todayStr() <= R.end ? todayStr() : R.start, cat: '', tag: '', desc: '', notes: '' };
  let added = 0;
  modal({
    title: existing ? 'Modifier la transaction' : 'Nouvelle transaction',
    submit: existing ? 'Enregistrer' : 'Ajouter',
    extraFooter: existing ? '' : `<label class="check"><input type="checkbox" name="serial" ${D.settings.serial ? 'checked' : ''}>Saisie en série</label>`,
    body: `${typeSeg(t.type)}
      <div class="row"><label class="f">Montant (€)<input name="amount" inputmode="decimal" value="${t.amount}" placeholder="0,00"></label>
        <label class="f">Date<input name="date" type="date" value="${t.date}"></label></div>
      <div class="row"><label class="f">Catégorie<select name="cat"></select></label>
        <label class="f">Étiquette<select name="tag">${tagOptions(t.tag)}</select></label></div>
      <label class="f">Description<input name="desc" value="${esc(t.desc)}"></label>
      <label class="f">Notes<textarea name="notes">${esc(t.notes)}</textarea></label>`,
    onMount: form => {
      const fill = type => { form.cat.innerHTML = catsOf(type).length ? catOptions(type, t.cat) : '<option value="">–</option>'; };
      fill(t.type);
      bindTypeSeg(form, fill);
      if (form.serial) form.serial.onchange = () => { D.settings.serial = form.serial.checked; persist(); };
    },
    onSubmit: (form, errEl) => {
      const amount = parseAmount(form.amount.value);
      if (!(amount > 0)) return 'Montant invalide.';
      if (!form.date.value) return 'Date manquante.';
      if (!form.cat.value) return NO_CAT;
      if (form.tag.value && form.tag.value === form.cat.value) return 'Étiquette identique à la catégorie.';
      const data = { type: segVal(form), amount, date: form.date.value, cat: form.cat.value, tag: form.tag.value || '', desc: form.desc.value.trim(), notes: form.notes.value.trim() };
      if (existing) Object.assign(D.tx.find(x => x.id === existing.id), data);
      else D.tx.push({ id: uid(), ...data });
      if (data.date < R.start || data.date > R.end) R = R.kind === 'custom' ? makeRange('month', data.date) : makeRange(R.kind, data.date);
      persist(); render();
      if (!existing && form.serial?.checked) {
        added++;
        errEl.classList.add('ok');
        errEl.textContent = `Ajouté : ${data.desc || catName(data.cat)} ${data.type === 'in' ? '+' : '−'}${eur(amount)} · ${plural(added, 'saisie')}`;
        form.amount.value = ''; form.desc.value = ''; form.notes.value = ''; form.tag.value = '';
        form.amount.focus();
        return KEEP_OPEN;
      }
      toast(existing ? 'Transaction modifiée' : 'Transaction ajoutée');
    }
  });
}

function subModal(existing) {
  const s = existing || { type: 'out', name: '', amount: '', cat: '', tag: '', day: 1, start: thisMonth(), end: '', notes: '' };
  modal({
    title: existing ? 'Modifier la mensualité' : 'Nouvelle mensualité',
    submit: existing ? 'Enregistrer' : 'Ajouter',
    body: `${typeSeg(s.type)}
      <div class="row"><label class="f">Nom<input name="name" value="${esc(s.name)}"></label>
        <label class="f" style="flex:.6">Montant (€)<input name="amount" inputmode="decimal" value="${s.amount}" placeholder="0,00"></label></div>
      <div class="row"><label class="f">Catégorie<select name="cat"></select></label>
        <label class="f">Étiquette<select name="tag">${tagOptions(s.tag)}</select></label></div>
      <div class="row"><label class="f">Jour du mois<input name="day" type="number" min="1" max="31" value="${s.day}"></label>
        <label class="f">Début<input name="start" type="month" value="${s.start}"></label>
        <label class="f">Fin (optionnel)<input name="end" type="month" value="${s.end || ''}"></label></div>
      <label class="f">Notes<textarea name="notes">${esc(s.notes || '')}</textarea></label>`,
    onMount: form => {
      const fill = type => { form.cat.innerHTML = catsOf(type).length ? catOptions(type, s.cat) : '<option value="">–</option>'; };
      fill(s.type); bindTypeSeg(form, fill);
    },
    onSubmit: form => {
      const amount = parseAmount(form.amount.value), day = +form.day.value;
      if (!form.name.value.trim()) return 'Nom manquant.';
      if (!(amount > 0)) return 'Montant invalide.';
      if (!form.cat.value) return NO_CAT;
      if (form.tag.value && form.tag.value === form.cat.value) return 'Étiquette identique à la catégorie.';
      if (!(day >= 1 && day <= 31)) return 'Jour invalide (1 à 31).';
      if (!form.start.value) return 'Mois de début manquant.';
      if (form.end.value && form.end.value < form.start.value) return 'La fin précède le début.';
      const data = { type: segVal(form), name: form.name.value.trim(), amount, cat: form.cat.value, tag: form.tag.value || '', day, start: form.start.value, end: form.end.value || '', notes: form.notes.value.trim() };
      if (existing) Object.assign(D.subs.find(x => x.id === existing.id), data);
      else D.subs.push({ id: uid(), ...data });
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
    body: `${existing ? '' : typeSeg(c.type)}
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
      if (!existing) bindTypeSeg(form, t => { $('.rules-edit', form).hidden = t === 'in'; });
    },
    onSubmit: form => {
      const name = form.name.value.trim();
      if (!name) return 'Nom manquant.';
      const type = existing ? c.type : segVal(form);
      if (D.cats.some(x => x.id !== existing?.id && x.type === type && x.name.toLowerCase() === name.toLowerCase())) return 'Catégorie déjà existante.';
      const rules = [];
      if (type === 'out') for (const row of $$('.rule-row', form)) {
        const kind = $('[data-r=kind]', row).value, value = parseAmount($('[data-r=value]', row).value), warn = +$('[data-r=warn]', row).value || 80;
        if (!(value > 0)) return 'Règle : maximum invalide.';
        if (kind === 'pct' && value > 100) return 'Règle : pourcentage supérieur à 100.';
        rules.push({ kind, value, warn: Math.min(100, Math.max(1, warn)) });
      }
      if (existing) Object.assign(D.cats.find(x => x.id === existing.id), { name, color, rules });
      else D.cats.push({ id: uid(), name, type, color, rules });
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
      if (existing) Object.assign(D.goals.find(x => x.id === existing.id), data);
      else {
        const init = form.initial.value.trim() ? parseAmount(form.initial.value) : 0;
        if (!(init >= 0)) return 'Montant déjà épargné invalide.';
        D.goals.push({ id: uid(), ...data, moves: init > 0 ? [{ id: uid(), date: todayStr(), amount: init }] : [] });
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
        rows: items.map(t => ({ date: fmtDate(t.date), type: t.type === 'in' ? 'Entrée' : 'Sortie', cat: catName(t.cat), tag: t.tag ? catName(t.tag) : '', desc: t.desc, notes: t.notes, amount: signOf(t), sub: t.sub ? 'Oui' : '' })) },
      { name: 'Mensualités', columns: [{ header: 'Nom', key: 'name', width: 24 }, { header: 'Type', key: 'type', width: 10 }, { header: 'Catégorie', key: 'cat', width: 22 }, { header: 'Jour', key: 'day', width: 8 }, { header: 'Montant', key: 'amount', money: 1 }, { header: 'Par an', key: 'year', money: 1 }, { header: 'Début', key: 'start' }, { header: 'Fin', key: 'end' }],
        rows: D.subs.map(s => ({ name: s.name, type: s.type === 'in' ? 'Entrée' : 'Sortie', cat: catName(s.cat), day: s.day, amount: s.amount, year: s.amount * 12, start: s.start, end: s.end || '' })) },
      { name: 'Objectifs', columns: [{ header: 'Objectif', key: 'name', width: 24 }, { header: 'Visé', key: 'target', money: 1 }, { header: 'Épargné', key: 'saved', money: 1 }, { header: 'Progression', key: 'p', pct: 1 }, { header: 'Échéance', key: 'deadline' }],
        rows: D.goals.map(g => { const s = sumBy(g.moves); return { name: g.name, target: g.target, saved: s, p: g.target ? s / g.target : 0, deadline: g.deadline || '' }; }) }
    ]
  });
  if (res) toast('Export Excel enregistré');
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
      body{font-family:"Segoe UI",sans-serif;color:#0f172a;margin:0;font-size:12px}
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
        ${st.items.slice().reverse().map(t => `<tr><td>${fmtDate(t.date)}</td><td>${esc(t.desc)}${t.sub ? ' <small style="color:#2f7cf6">(mensualité)</small>' : ''}</td><td>${esc(catName(t.cat))}</td><td>${t.tag ? esc(catName(t.tag)) : ''}</td><td class="r ${t.type}">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</td></tr>`).join('') || '<tr><td colspan="5">Aucune transaction</td></tr>'}
      </table>
      ${D.goals.length ? `<h2>Objectifs d'épargne</h2><table><tr><th>Objectif</th><th class="r">Épargné</th><th class="r">Visé</th><th class="r">Progression</th></tr>${D.goals.map(g => { const s = sumBy(g.moves); return `<tr><td>${esc(g.name)}</td><td class="r">${eur(s)}</td><td class="r">${eur(g.target)}</td><td class="r">${pct(s / g.target * 100, 0)}</td></tr>`; }).join('')}</table>` : ''}
      <div class="foot">Tmoney</div>
    </body></html>`;
    D.settings.discreet = discreet;
    const res = await api.exportPdf(html, `Tmoney-rapport-${r.start}_${r.end}.pdf`);
    if (res) toast('Rapport PDF enregistré');
  } finally { D.settings.discreet = discreet; }
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
    D = { ...base, ...r.data, settings: { ...base.settings, ...(r.data.settings || {}) } };
    $('#lockScreen').hidden = true;
    startApp();
  } else {
    $('#unlockPin').value = '';
    $('#unlockErr').textContent = r.error === 'wait' ? `Trop de tentatives. Réessayer dans ${r.seconds} s.` : `PIN incorrect. ${plural(r.left, 'essai')} restant${r.left > 1 ? 's' : ''}.`;
    $('#unlockPin').focus();
  }
};
$('#forgotPin').onclick = async () => { if (await api.reset()) { $('#lockScreen').hidden = true; welcome(); } };
async function lockApp() {
  await persist(); await api.lock();
  $$('.modal-bg').forEach(m => m.remove());
  Object.values(charts).forEach(c => c.destroy());
  editing = false;
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
function startApp() {
  $('#app').hidden = false;
  R = makeRange('month', todayStr());
  if (!bound) bindEvents();
  go('dashboard');
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
  $('#resetLayout').onclick = () => { D.settings.layout = defaultLayout(); persist(); renderDashboard(); };
  bindLayoutDnd();
  $('#quickAdd').onclick = () => ({ subs: () => subModal(), cats: () => catModal(), goals: () => goalModal() }[page] || (() => txModal(null, txType === 'in' ? 'in' : 'out')))();
  $('#themeToggle').onclick = () => { D.settings.theme = D.settings.theme === 'dark' ? 'light' : 'dark'; persist(); render(); };
  $('#discreetToggle').onclick = () => { D.settings.discreet = !D.settings.discreet; persist(); render(); };
  $$('#setTheme button').forEach(b => b.onclick = () => { D.settings.theme = b.dataset.v; persist(); render(); });
  $$('#setDiscreet button').forEach(b => b.onclick = () => { D.settings.discreet = b.dataset.v === 'on'; persist(); render(); });
  $('#lockBtn').onclick = lockApp; $('#lockBtn2').onclick = lockApp;
  $('#changePinBtn').onclick = changePinModal;
  $('#expXlsx').onclick = exportXlsx;
  $('#expPdf').onclick = exportPdf;
  $('#txSearch').oninput = renderTransactions;
  $('#txScope').onchange = renderTransactions;
  $('#txFilterCat').onchange = renderTransactions;
  $$('#txFilterType button').forEach(b => b.onclick = () => { txType = b.dataset.v; $$('#txFilterType button').forEach(x => x.classList.toggle('on', x === b)); renderTransactions(); });

  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-toggle-block],[data-cat-detail],[data-new-cat],[data-edit-tx],[data-del-tx],[data-edit-sub],[data-del-sub],[data-toggle-sub],[data-edit-cat],[data-del-cat],[data-edit-goal],[data-del-goal],[data-goal-move]');
    if (!el || $('#app').hidden) return;
    const d = el.dataset;
    if (d.toggleBlock) {
      const L = layout(), b = L.find(x => x.id === d.toggleBlock); b.hidden = !b.hidden;
      D.settings.layout = L; persist(); renderDashboard();
    }
    else if (d.catDetail) { if (!editing) catDetail(d.catDetail); }
    else if (d.newCat) { e.preventDefault(); catModal(null, d.newCat); }
    else if (d.editTx) txModal(D.tx.find(t => t.id === d.editTx));
    else if (d.delTx) { if (await confirmModal('Supprimer la transaction', 'Suppression définitive de cette transaction.')) { D.tx = D.tx.filter(t => t.id !== d.delTx); persist(); render(); } }
    else if (d.editSub) subModal(D.subs.find(s => s.id === d.editSub));
    else if (d.delSub) { if (await confirmModal('Supprimer la mensualité', 'La mensualité sera retirée de tous les mois, y compris passés.<br><br>Pour conserver l\'historique : utiliser « Arrêter ».')) { D.subs = D.subs.filter(s => s.id !== d.delSub); persist(); render(); } }
    else if (d.toggleSub) {
      // Arrêter : comptée jusqu'au mois précédent (historique conservé). Reprendre : plus de date de fin.
      const s = D.subs.find(x => x.id === d.toggleSub), m = thisMonth();
      s.end = subActiveIn(s, m) ? shiftMonth(m, -1) : '';
      persist(); render();
    }
    else if (d.editCat) catModal(cat(d.editCat));
    else if (d.delCat) {
      const used = D.tx.filter(t => t.cat === d.delCat || t.tag === d.delCat).length + D.subs.filter(s => s.cat === d.delCat || s.tag === d.delCat).length;
      if (used) { modal({ title: 'Suppression impossible', body: `<p style="margin:0">« ${esc(catName(d.delCat))} » est utilisée par ${plural(used, 'élément')} (transactions ou mensualités).</p>`, submit: 'OK', cancel: false, onSubmit: () => {} }); return; }
      if (await confirmModal('Supprimer la catégorie', `Suppression de « ${esc(catName(d.delCat))} ».`)) { D.cats = D.cats.filter(c => c.id !== d.delCat); persist(); render(); }
    }
    else if (d.editGoal) goalModal(D.goals.find(g => g.id === d.editGoal));
    else if (d.delGoal) { if (await confirmModal("Supprimer l'objectif", "Suppression de l'objectif et de son historique.")) { D.goals = D.goals.filter(g => g.id !== d.delGoal); persist(); render(); } }
    else if (d.goalMove) goalMoveModal(D.goals.find(g => g.id === d.goalMove), +d.dir);
  });

  document.addEventListener('keydown', e => {
    if ($('#app').hidden || $('.modal-bg')) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && k === 'n') { e.preventDefault(); $('#quickAdd').click(); }
    if (e.ctrlKey && k === 'f') { e.preventDefault(); go('transactions'); $('#txScope').value = 'all'; renderTransactions(); $('#txSearch').focus(); }
    if (e.ctrlKey && k === 'd') { e.preventDefault(); $('#discreetToggle').click(); }
  });
}

(async function init() {
  paintIcons();
  if (await api.exists()) showLock(); else welcome();
})();
