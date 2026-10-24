// Modo Build. Las esferas de atelier, las agujas delfín y lanceta, la caja Flieger
// y los cielos ámbar / esmeralda / tinta / arena no los usa ningún reloj de la casa.
// Lo que el jugador confirma se guarda en localStorage y se registra en WATCHES.
import { WATCHES } from './data/watches.js';
import { CALIBERS, makeGrand } from './data/calibers.js';

const KEY = 'zarumei.builds.v1';
const MAX = 12;

export const BUILD_OPTS = {
  case: [
    { id: 'diver', label: 'Buceo', hint: 'Bisel y protectores de corona' },
    { id: 'slim', label: 'Vestir', hint: 'Caja fina, correa' },
    { id: 'octagon', label: 'Octava', hint: 'Bisel de ocho lados' },
    { id: 'crono', label: 'Pulsadores', hint: 'Caja con pulsadores' },
    { id: 'cupula', label: 'Cúpula', hint: 'Cristal abombado' },
    { id: 'pilot', label: 'Flieger', hint: 'Esta caja no se vende' }
  ],
  metal: [
    { id: 'steel', label: 'Acero' },
    { id: 'gold', label: 'Oro 18k' },
    { id: 'rose', label: 'Oro rosa' }
  ],
  dial: [
    { id: 'verde', label: 'Verde', hint: 'Solo atelier', auto: true, quartz: true, atelier: true },
    { id: 'negro', label: 'Negro', hint: 'Solo atelier', auto: true, quartz: true, atelier: true },
    { id: 'coral', label: 'Coral', hint: 'Solo atelier', auto: true, quartz: true, atelier: true },
    { id: 'humo', label: 'Humo', hint: 'Solo atelier', auto: true, quartz: true, atelier: true },
    { id: 'cuba', label: 'Azul', hint: 'Sol y el oso', auto: true, quartz: true },
    { id: 'ancla', label: 'Ancla', hint: 'Azul marino', auto: true, quartz: true },
    { id: 'miami', label: 'Miami', hint: 'Esfera de la casa', auto: true, quartz: false },
    { id: 'octava', label: 'Geométrica', hint: 'Azul facetado', auto: true, quartz: false },
    { id: 'lira', label: 'Crema', hint: 'Cuarzo', auto: false, quartz: true },
    { id: 'rose', label: 'Blanca', hint: 'Cuarzo', auto: false, quartz: true }
  ],
  cielo: [
    { id: 'amber', label: 'Ámbar', hint: 'Turbillón', for: 'ZT18' },
    { id: 'emerald', label: 'Esmeralda', hint: 'Turbillón', for: 'ZT18' },
    { id: 'ink', label: 'Tinta', hint: 'Ópera', for: 'ZX60' },
    { id: 'sand', label: 'Arena', hint: 'Ópera', for: 'ZX60' }
  ],
  hands: [
    { id: 'sword', label: 'Espada' },
    { id: 'baton', label: 'Bastón' },
    { id: 'leaf', label: 'Hoja' },
    { id: 'dauphine', label: 'Delfín', hint: 'Sin lume' },
    { id: 'arrow', label: 'Lanceta', hint: 'Con lume' }
  ],
  caliber: [
    { id: 'ZQ11', label: 'ZQ-11', hint: 'Cuarzo · pocas piezas' },
    { id: 'ZR28', label: 'ZR-28', hint: 'Automático' },
    { id: 'ZC', label: 'Cronógrafo', hint: 'Día, mes, profundidad' },
    { id: 'ZT18', label: 'Turbillón', hint: 'Jaula a la vista' },
    { id: 'ZX60', label: 'Ópera', hint: 'El desarme más largo' }
  ],
  extra: [
    { id: 'none', label: 'Solo crono', hint: 'Día, mes y profundidad' },
    { id: 'compass', label: 'Brújula' },
    { id: 'mil', label: '24 horas' },
    { id: 'moon', label: 'Luna' },
    { id: 'compassMil', label: 'Brújula y 24 h' },
    { id: 'all', label: 'Las tres', hint: 'Brújula, 24 h y luna' }
  ]
};

const DIAL_DATE = { cuba: true, ancla: true, miami: true, octava: true, lira: false, rose: false, verde: true, negro: true, coral: true, humo: true };
const STYLE = { diver: 'diver', slim: 'slim', octagon: 'octagon', crono: 'chrono', cupula: 'astral', pilot: 'pilot' };
const DIAL_R = { diver: 16.2, slim: 15.4, octagon: 15.2, crono: 16.2, cupula: 15.6, pilot: 15.0 };
const CASE_R = { diver: 20.5, slim: 19, octagon: 21, crono: 21, cupula: 21, pilot: 20 };
const METAL_NAME = { steel: 'Acero', gold: 'Oro', rose: 'Rosa' };
const CASE_NAME = { diver: 'Buceo', slim: 'Vestir', octagon: 'Octava', crono: 'Pulsadores', cupula: 'Cúpula', pilot: 'Flieger' };
const LEVEL = { ZQ11: 'Cuarzo corto', ZR28: 'Automático', ZC: 'Cronógrafo', ZT18: 'Turbillón', ZX60: 'Ópera' };
// Distinto de Astral Miami y de Astral Cuba. Las jaulas caben dentro del cielo de 13,5.
const TALLER = { time: [-6.4, -4.6], bear: [6.6, -3.8], diamond: [5.2, 5.4], balance: [-5.4, 5.0] };

export const DRAFT_ID = 'build_draft';

function optOk(group, id) { return BUILD_OPTS[group].some(o => o.id === id); }
const labelOf = (group, id) => (BUILD_OPTS[group].find(o => o.id === id) || {}).label || '';

export function dialFits(caliber, dialId) {
  const d = BUILD_OPTS.dial.find(o => o.id === dialId);
  if (!d) return false;
  if (caliber === 'ZT18' || caliber === 'ZX60') return false;
  if (caliber === 'ZC') return !!d.atelier;
  return caliber === 'ZQ11' ? !!d.quartz : !!d.auto;
}

export function caseFits(caliber, caseId) {
  if (!optOk('case', caseId)) return false;
  if (caliber === 'ZC') return caseId === 'diver' || caseId === 'crono';
  if (caliber === 'ZT18' || caliber === 'ZX60') return caseId === 'diver' || caseId === 'cupula' || caseId === 'crono';
  return true;
}

export function cieloFits(caliber, cieloId) {
  const o = BUILD_OPTS.cielo.find(c => c.id === cieloId);
  if (!o) return false;
  return o.for === caliber;
}

export function cleanName(s) {
  const t = String(s || '').replace(/[<>&]/g, '').trim().slice(0, 28);
  return t || 'Mi ZARUMEI';
}

export function suggestedName(spec) {
  const sky = spec && (spec.caliber === 'ZT18' || spec.caliber === 'ZX60');
  const face = sky ? labelOf('cielo', spec.cielo || (spec.caliber === 'ZX60' ? 'ink' : 'amber')) : labelOf('dial', spec && spec.dial);
  return cleanName(`ZARUMEI ${face} ${CASE_NAME[spec && spec.case] || ''}`);
}

function extraFlags(extra) {
  return {
    emblem: 'sello',
    compass: extra === 'compass' || extra === 'compassMil' || extra === 'all',
    military: extra === 'mil' || extra === 'compassMil' || extra === 'all',
    moon: extra === 'moon' || extra === 'all'
  };
}

// Un spec viejo (sin extra ni cielo) sigue siendo válido. null si la caja no admite el calibre.
export function normalizeSpec(spec) {
  if (!spec || !optOk('case', spec.case) || !optOk('metal', spec.metal) || !optOk('dial', spec.dial) || !optOk('hands', spec.hands) || !optOk('caliber', spec.caliber)) return null;
  const caliber = spec.caliber;
  const sky = caliber === 'ZT18' || caliber === 'ZX60';
  if (!sky && !dialFits(caliber, spec.dial)) return null;
  if (!caseFits(caliber, spec.case)) return null;
  let cielo = optOk('cielo', spec.cielo) ? spec.cielo : 'amber';
  if (caliber === 'ZT18' && !cieloFits('ZT18', cielo)) cielo = 'amber';
  if (caliber === 'ZX60' && !cieloFits('ZX60', cielo)) cielo = 'ink';
  const extra = optOk('extra', spec.extra) ? spec.extra : 'none';
  return { case: spec.case, metal: spec.metal, dial: spec.dial, hands: spec.hands, caliber, extra, cielo };
}

export function buildSummary(spec) {
  const n = normalizeSpec(spec);
  if (!n) return 'Esa combinación no entra en la caja.';
  const bits = [LEVEL[n.caliber]];
  if (n.caliber === 'ZC') bits.push(labelOf('extra', n.extra));
  if (n.caliber === 'ZT18' || n.caliber === 'ZX60') bits.push(labelOf('cielo', n.cielo));
  else {
    bits.push(labelOf('dial', n.dial));
    bits.push(labelOf('hands', n.hands));
  }
  const fresh = !!(BUILD_OPTS.dial.find(d => d.id === n.dial) || {}).atelier
    || n.hands === 'dauphine' || n.hands === 'arrow'
    || n.case === 'crono' || n.case === 'cupula' || n.case === 'pilot'
    || n.caliber === 'ZC' || n.caliber === 'ZT18' || n.caliber === 'ZX60';
  if (!fresh) bits.push('esa mezcla ya está en la casa');
  return bits.filter(Boolean).join(' · ');
}

function backLine(n, metal) {
  const metalName = metal === 'steel' ? 'ACERO' : metal === 'rose' ? 'ORO ROSA' : 'ORO 18K';
  const mov = n.caliber === 'ZC' ? 'CHRONOGRAPHE' : n.caliber === 'ZT18' ? 'TOURBILLON' : n.caliber === 'ZX60' ? 'OPERA' : n.caliber === 'ZR28' ? 'AUTOMATIC · 28.800 A/h' : 'QUARTZ';
  return `ZARUMEI · ATELIER · ${mov} · ${metalName} · `;
}

// Definición que entienden las cajas y los calibres. null si el spec no se puede montar.
export function watchFromSpec(id, spec, name) {
  const n = normalizeSpec(spec);
  if (!n) return null;
  const metal = n.metal;
  const style = STYLE[n.case];
  const screw = n.caliber !== 'ZQ11';
  const sky = n.caliber === 'ZT18' || n.caliber === 'ZX60';
  let caliber = n.caliber;
  let grand = null;
  if (n.caliber === 'ZC') {
    const opt = extraFlags(n.extra);
    const cid = 'ZA' + String(id).replace(/[^a-z0-9]/gi, '').slice(0, 12);
    const desc = 'Cronógrafo de atelier con el sello, día, mes y profundímetro' + (opt.compass ? ', brújula' : '') + (opt.military ? ', 24 h' : '') + (opt.moon ? ' y luna' : '') + '.';
    CALIBERS[cid] = makeGrand(cid, 'ZC-Atelier', desc, opt);
    caliber = cid;
    grand = opt;
  }
  const dialKind = n.caliber === 'ZT18' ? 'astral' : n.caliber === 'ZX60' ? 'habana' : n.dial;
  const dialR = n.caliber === 'ZT18' ? 12.2 : n.caliber === 'ZX60' ? 13.6 : n.caliber === 'ZC' ? 16.2 : DIAL_R[n.case];
  const face = sky ? labelOf('cielo', n.cielo) : labelOf('dial', n.dial);
  const w = {
    id,
    name: cleanName(name),
    caliber,
    custom: true,
    blurb: `${LEVEL[n.caliber]} · ${CASE_NAME[n.case]} · ${face}.`,
    case: {
      style, metal, r: CASE_R[n.case],
      bezel: n.case === 'diver' && metal === 'steel' ? 'ceramicBlack' : (n.case === 'diver' || n.case === 'crono') ? 'engraved' : 'polished',
      crownGuards: n.case === 'diver' || n.case === 'crono',
      caseback: screw ? 'screw' : 'snap',
      backText: backLine(n, metal),
      backMono: 'Z'
    },
    dial: { kind: dialKind, r: dialR, date: n.caliber === 'ZR28' && !!DIAL_DATE[n.dial] },
    hands: { style: n.hands, metal },
    bracelet: { style: style === 'slim' || style === 'pilot' || style === 'astral' ? 'alligator' : 'oyster', metal },
    rotorText: 'ZARUMEI · ATELIER'
  };
  if (grand) w.grand = grand;
  if (n.caliber === 'ZT18') w.astral = { sky: n.cielo, bear: 'sello', layout: TALLER };
  if (n.caliber === 'ZX60') { w.habana = n.cielo; w.opera = true; }
  return w;
}

function readRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function writeRaw(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* el teléfono puede negar el almacén */ }
}

export function loadBuilds() {
  const out = [];
  for (const rec of readRaw()) {
    if (!rec || typeof rec.id !== 'string' || !/^b[a-z0-9]{4,}$/.test(rec.id)) continue;
    const spec = rec.spec || {};
    const w = watchFromSpec(rec.id, spec, rec.name);
    if (!w) continue;
    WATCHES[w.id] = w;
    out.push({ id: w.id, name: w.name, spec: normalizeSpec(spec), ready: !!rec.ready });
  }
  return out;
}

export function builds() {
  return readRaw().filter(r => r && r.id && WATCHES[r.id]);
}

export function isBuildReady(id) {
  return builds().some(r => r.id === id && r.ready);
}

export function rememberBuild(id, spec, name) {
  const n = normalizeSpec(spec);
  const w = n && watchFromSpec(id, n, name);
  if (!w) return null;
  const list = readRaw().filter(r => r && r.id !== id && r.id !== DRAFT_ID);
  list.unshift({ id, name: w.name, spec: n, ready: false });
  writeRaw(list);
  WATCHES[id] = w;
  return w;
}

export function markBuildReady(id) {
  const list = readRaw();
  const rec = list.find(r => r && r.id === id);
  if (!rec) return false;
  rec.ready = true;
  writeRaw(list);
  return true;
}

export function forgetBuild(id) {
  const before = readRaw();
  const had = before.some(r => r && r.id === id);
  writeRaw(before.filter(r => r && r.id !== id));
  delete WATCHES[id];
  return had;
}

export function importDealBuild(name, spec) {
  const id = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36);
  const w = rememberBuild(id, spec, name);
  if (!w || !markBuildReady(id)) return null;
  return w;
}
