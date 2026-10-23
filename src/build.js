// Modo Build. El catálogo solo usa cajas, esferas y calibres que el taller ya sabe montar
// (ZR-28 y ZQ-11). Lo que el jugador confirma se guarda en localStorage y se registra
// en WATCHES para que el motor y Modo libre lo traten como un reloj más.
import { WATCHES } from './data/watches.js';

const KEY = 'zarumei.builds.v1';
const MAX = 12;

export const BUILD_OPTS = {
  case: [
    { id: 'diver', label: 'Buceo', hint: 'Bisel y protectores de corona' },
    { id: 'slim', label: 'Vestir', hint: 'Caja fina, correa' },
    { id: 'octagon', label: 'Octava', hint: 'Bisel de ocho lados' }
  ],
  metal: [
    { id: 'steel', label: 'Acero' },
    { id: 'gold', label: 'Oro 18k' },
    { id: 'rose', label: 'Oro rosa' }
  ],
  dial: [
    { id: 'cuba', label: 'Azul', hint: 'Sol y el oso', auto: true, quartz: true },
    { id: 'ancla', label: 'Ancla', hint: 'Azul marino', auto: true, quartz: true },
    { id: 'miami', label: 'Miami', hint: 'Esfera de la casa', auto: true, quartz: false },
    { id: 'octava', label: 'Geométrica', hint: 'Azul facetado', auto: true, quartz: false },
    { id: 'lira', label: 'Crema', hint: 'Cuarzo', auto: false, quartz: true },
    { id: 'rose', label: 'Blanca', hint: 'Cuarzo', auto: false, quartz: true }
  ],
  hands: [
    { id: 'sword', label: 'Espada' },
    { id: 'baton', label: 'Bastón' },
    { id: 'leaf', label: 'Hoja' }
  ],
  caliber: [
    { id: 'ZR28', label: 'ZR-28', hint: 'Automático' },
    { id: 'ZQ11', label: 'ZQ-11', hint: 'Cuarzo' }
  ]
};

const DIAL_DATE = { cuba: true, ancla: true, miami: true, octava: true, lira: false, rose: false };
const DIAL_R = { diver: 16.2, slim: 15.4, octagon: 15.2 };
const CASE_R = { diver: 20.5, slim: 19, octagon: 21 };
const METAL_NAME = { steel: 'Acero', gold: 'Oro', rose: 'Rosa' };
const CASE_NAME = { diver: 'Buceo', slim: 'Vestir', octagon: 'Octava' };

export const DRAFT_ID = 'build_draft';

export function dialFits(caliber, dialId) {
  const d = BUILD_OPTS.dial.find(o => o.id === dialId);
  if (!d) return false;
  // La palabra va pintada en la esfera (AUTOMATIC / QUARTZ). No se cruzan.
  return caliber === 'ZQ11' ? !!d.quartz : !!d.auto;
}

export function cleanName(s) {
  const t = String(s || '').replace(/[<>&]/g, '').trim().slice(0, 28);
  return t || 'Mi ZARUMEI';
}

export function suggestedName(spec) {
  return cleanName(`ZARUMEI ${METAL_NAME[spec.metal] || ''} ${CASE_NAME[spec.case] || ''}`);
}

function optOk(group, id) { return BUILD_OPTS[group].some(o => o.id === id); }

// Definición que entienden buildCase / buildZR28 / buildZQ11. null si el spec no es del catálogo.
export function watchFromSpec(id, spec, name) {
  if (!spec || !optOk('case', spec.case) || !optOk('metal', spec.metal) || !optOk('dial', spec.dial) || !optOk('hands', spec.hands) || !optOk('caliber', spec.caliber)) return null;
  if (!dialFits(spec.caliber, spec.dial)) return null;
  const metal = spec.metal, style = spec.case, caliber = spec.caliber;
  const screw = caliber === 'ZR28';
  const kind = spec.dial;
  return {
    id,
    name: cleanName(name),
    caliber,
    custom: true,
    blurb: `${CASE_NAME[style]} · ${METAL_NAME[metal]} · esfera ${BUILD_OPTS.dial.find(d => d.id === kind).label.toLowerCase()}.`,
    case: {
      style, metal, r: CASE_R[style],
      bezel: style === 'diver' && metal === 'steel' ? 'ceramicBlack' : style === 'diver' ? 'engraved' : 'polished',
      crownGuards: style === 'diver',
      caseback: screw ? 'screw' : 'snap',
      backText: `ZARUMEI · ATELIER · ${screw ? 'AUTOMATIC · 28.800 A/h' : 'QUARTZ'} · ${metal === 'steel' ? 'ACERO' : metal === 'rose' ? 'ORO ROSA' : 'ORO 18K'} · `,
      backMono: 'Z'
    },
    dial: { kind, r: DIAL_R[style], date: screw && !!DIAL_DATE[kind] },
    hands: { style: spec.hands, metal },
    bracelet: { style: style === 'slim' ? 'alligator' : 'oyster', metal },
    rotorText: 'ZARUMEI · ATELIER'
  };
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

// Registra en WATCHES los relojes de este teléfono. Los que no están listos no salen en Modo libre.
export function loadBuilds() {
  const out = [];
  for (const rec of readRaw()) {
    if (!rec || typeof rec.id !== 'string' || !/^b[a-z0-9]{4,}$/.test(rec.id)) continue;
    const spec = rec.spec || {};
    const w = watchFromSpec(rec.id, spec, rec.name);
    if (!w) continue;
    WATCHES[w.id] = w;
    out.push({ id: w.id, name: w.name, spec, ready: !!rec.ready });
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
  const w = watchFromSpec(id, spec, name);
  if (!w) return null;
  const list = readRaw().filter(r => r && r.id !== id && r.id !== DRAFT_ID);
  list.unshift({ id, name: w.name, spec: { case: spec.case, metal: spec.metal, dial: spec.dial, hands: spec.hands, caliber: spec.caliber }, ready: false });
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
  writeRaw(readRaw().filter(r => r && r.id !== id));
  delete WATCHES[id];
}
