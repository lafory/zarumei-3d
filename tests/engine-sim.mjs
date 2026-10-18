// Simulación sin navegador: juega cada reloj × falla con el planificador (pista) y comprueba que se termina sin errores.
import { createEngine } from '../src/engine.js';
import { WATCHES } from '../src/data/watches.js';
import { CALIBERS } from '../src/data/calibers.js';
import { FAULTS } from '../src/data/faults.js';
import { STORY } from '../src/data/story.js';
export function autoplay(E, { log = false, max = 2000 } = {}) {
  let bads = 0, n = 0;
  for (; n < max && !E.finished; n++) {
    const a = E.suggest(); if (!a) return { ok: false, why: 'sin sugerencia', n, goal: E.goal(), miss: E.missingList() };
    let r;
    if (a.button) r = E.button(a.button);
    else if (a.target.screw) { do { r = E.screwTurn(a.target.screw, a.tool, a.size, 0.34); } while (r.kind === 'turn'); }
    else if (a.target.chip) r = E.tapChip(a.target.chip, a.tool, a.size);
    else r = E.tapPart(a.target.sub || a.target.part, a.tool, a.size);
    if (log) console.log(n, JSON.stringify(a), '→', r.kind, r.msg.replace(/<[^>]+>/g, '').slice(0, 90));
    if (r.kind === 'bad') { bads++; if (bads > 3) return { ok: false, why: 'errores: ' + r.msg, n, a }; }
  }
  return { ok: E.finished, n, bads, score: E.score, stats: E.stats };
}
if (process.argv[1].endsWith('engine-sim.mjs')) {
  let fail = 0;
  for (const w of Object.values(WATCHES)) for (const f of Object.values(FAULTS)) {
    if (!f.calibers.includes(CALIBERS[w.caliber].type)) continue;
    const r = autoplay(createEngine({ watchId: w.id, faultId: f.id }), { log: process.env.LOG === w.id + ':' + f.id });
    console.log(r.ok ? 'OK ' : 'FAIL', w.id.padEnd(6), f.id.padEnd(12), JSON.stringify(r).slice(0, 220)); if (!r.ok) fail++;
  }
  for (const s of STORY) { const r = autoplay(createEngine({ watchId: s.watch, faultId: s.fault, story: s })); console.log(r.ok ? 'OK ' : 'FAIL', 'story', s.id, JSON.stringify(r).slice(0, 160)); if (!r.ok) fail++; }
  process.exit(fail ? 1 : 0);
}
