// Libro del taller. Las cuentas viven en este teléfono (el sitio es estático).
// La clave no se guarda en claro: se guarda una huella con sal.

const KEY = 'zarumei.book';

function hash(pw, salt) {
  const s = String(salt) + '\0' + String(pw);
  let x = 2166136261;
  for (let r = 0; r < 4000; r++) {
    for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
    x >>>= 0;
  }
  return (x >>> 0).toString(16);
}

function emptyStats() {
  return { watches: 0, bestScore: 0, bestMs: null, totalMs: 0, totalScore: 0, byWatch: {}, runs: [] };
}

function blank({ id, name, login, role, pass }) {
  return { id, name, login, pass: pass || null, role, created: Date.now(), storyDone: 0, stats: emptyStats(), saves: [] };
}

let db = { users: [], session: null };

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* privado o lleno */ }
}

export function boot() {
  try { db = JSON.parse(localStorage.getItem(KEY)) || db; } catch (e) { db = { users: [], session: null }; }
  if (!db.users) db.users = [];
  if (!db.users.some(u => u.role === 'admin')) {
    db.users.unshift(blank({ id: 'maestro', name: 'Maestro', login: 'maestro', role: 'admin', pass: hash('atelier', 'maestro') }));
    write();
  }
  if (db.session && !db.users.some(u => u.id === db.session)) db.session = null;
  takeLegacyStory();
}

function takeLegacyStory() {
  let n = 0;
  try { n = +(localStorage.getItem('zarumei.story') || 0); } catch (e) { n = 0; }
  const u = current();
  if (u && u.role !== 'admin' && n > (u.storyDone || 0)) { u.storyDone = n; write(); }
}

export function current() { return db.users.find(u => u.id === db.session) || null; }

export function login(name, pass) {
  const key = String(name || '').trim().toLowerCase();
  const u = db.users.find(x => x.login === key && x.pass);
  if (!u || u.pass !== hash(pass, u.id)) return { err: 'Nombre o clave incorrectos.' };
  db.session = u.id; write(); takeLegacyStory(); return { user: publicUser(u) };
}

export function register(name, pass) {
  const display = String(name || '').trim().replace(/\s+/g, ' ');
  if (display.length < 2 || display.length > 18) return { err: 'El nombre va de 2 a 18 letras.' };
  if (!/^[\p{L}\p{N} ._-]+$/u.test(display)) return { err: 'Usa solo letras y números en el nombre.' };
  if (String(pass || '').length < 4) return { err: 'La clave necesita al menos 4 caracteres.' };
  const key = display.toLowerCase();
  if (db.users.some(u => u.login === key)) return { err: 'Ese nombre ya está en el libro.' };
  const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const u = blank({ id, name: display, login: key, role: 'player', pass: hash(pass, id) });
  db.users.push(u); db.session = id; write(); takeLegacyStory(); return { user: publicUser(u) };
}

export function enterGuest() {
  let u = db.users.find(x => x.role === 'guest');
  if (!u) {
    u = blank({ id: 'guest', name: 'Invitado', login: 'invitado', role: 'guest' });
    db.users.push(u);
  }
  db.session = u.id; write(); takeLegacyStory(); return publicUser(u);
}

export function logout() { db.session = null; write(); }

export function storyDone() {
  const u = current();
  return u ? (u.role === 'admin' ? 99 : (u.storyDone || 0)) : 0;
}
export function setStory(n) {
  const u = current(); if (!u || u.role === 'admin') return;
  if (n > (u.storyDone || 0)) { u.storyDone = n; write(); }
}

export function recordRun(run) {
  const u = current(); if (!u) return;
  const st = u.stats;
  st.watches++;
  st.totalMs += run.ms;
  st.totalScore += run.score;
  if (run.score > st.bestScore) st.bestScore = run.score;
  if (st.bestMs == null || run.ms < st.bestMs) st.bestMs = run.ms;
  const prev = st.byWatch[run.watch];
  if (!prev || run.ms < prev.ms || (run.ms === prev.ms && run.score > prev.score)) st.byWatch[run.watch] = { ms: run.ms, score: run.score };
  st.runs.unshift({ watch: run.watch, fault: run.fault, mode: run.mode, ms: run.ms, score: run.score, at: Date.now() });
  st.runs = st.runs.slice(0, 30);
  const key = jobKey(run);
  u.saves = u.saves.filter(s => s.key !== key);
  write();
}

function jobKey(j) { return [j.watch, j.fault, j.story || '', j.mode || 'play'].join('|'); }

export function saves() { return (current()?.saves || []).slice(); }

export function putSave(job) {
  const u = current(); if (!u) return null;
  const key = jobKey(job);
  const row = { key, watch: job.watch, fault: job.fault, story: job.story || '', mode: job.mode || 'play', label: job.label || '', elapsed: job.elapsed | 0, score: job.score | 0, snap: job.snap, at: Date.now() };
  const prev = u.saves.find(s => s.key === key);
  if (prev) Object.assign(prev, row); else u.saves.unshift(row);
  u.saves = u.saves.slice(0, 8);
  write();
  return row;
}

export function dropSave(key) {
  const u = current(); if (!u) return;
  u.saves = u.saves.filter(s => s.key !== key); write();
}

export function roster() {
  return db.users.map(u => ({ id: u.id, name: u.name, role: u.role, created: u.created, stats: { watches: u.stats.watches, bestScore: u.stats.bestScore, bestMs: u.stats.bestMs, totalScore: u.stats.totalScore } }));
}

export function removeUser(id) {
  const me = current();
  if (!me || me.role !== 'admin') return { err: 'Solo el administrador.' };
  if (id === me.id || id === 'maestro') return { err: 'Esa cuenta no se borra.' };
  db.users = db.users.filter(u => u.id !== id); write(); return {};
}

function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, stats: u.stats, storyDone: u.storyDone, saves: u.saves };
}

export function fmtMs(ms) {
  if (ms == null || !isFinite(ms)) return '—';
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  return m + ':' + String(sec).padStart(2, '0');
}
