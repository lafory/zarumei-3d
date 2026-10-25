// Prueba E2E v2 en iPhone 13 (Playwright + Chromium/SwiftShader WebGL).
//  1) Historia · Caso 1 (Miami, aceite seco): diagnóstico, desarme hasta la falla, reparación y
//     MONTAJE MANUAL con TOQUES REALES (raycast sobre piezas y tornillos, chips de la bandeja,
//     selección de punta de destornillador, mantener pulsado para girar tornillos).
//     Incluye errores a propósito: punta demasiado grande, punta demasiado pequeña, orden incorrecto.
//  2) Modo libre con cada reloj (Miami, Cuba, Rosé) «sin falla»: desarme COMPLETO y montaje completo.
//  3) Sin errores de consola; mide draw calls / triángulos / FPS.
import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.URL || 'file://' + ROOT + '/index.html?test=1';
const SHOTS = ROOT + '/shots/'; fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
p.on('requestfailed', r => errs.push('requestfailed: ' + r.url()));
const log = (...a) => console.log(...a);
const T0 = Date.now();
const shot = (n) => p.screenshot({ path: SHOTS + n, timeout: 180000 });
const msg = () => p.evaluate(() => document.querySelector('#msg').textContent);
const st = () => p.evaluate(() => __game.state);
async function idle() {
  for (;;) {
    const s = await p.evaluate(() => ({ busy: __game.busy, tg: !document.querySelector('#tgPanel').hidden, ok: !document.querySelector('#tgClose').disabled }));
    if (s.tg && s.ok) { await p.waitForTimeout(150); await p.tap('#tgClose'); await p.waitForTimeout(150); continue; }
    if (!s.busy && !s.tg) break; await p.waitForTimeout(120);
  }
}
async function tool(id, size) {
  const cur = await p.evaluate(() => document.querySelector('.tool.sel')?.dataset.tool || null);
  if (cur !== id) { await p.tap(`.tool[data-tool="${id}"]`); await p.waitForTimeout(60); }
  if (size) { await p.tap(`.size[data-size="${size}"]`); await p.waitForTimeout(40); }
}
async function ensureView(target) {
  const v = await p.evaluate(() => __game.view);
  if (target.button === 'flipHolder' && v !== 'holder') { await p.tap('.vbtn[data-view="holder"]'); await idle(); }
  if (target.button === 'flipWatch' && !['front', 'back'].includes(v)) { await p.tap('.vbtn[data-view="watch"]'); await idle(); }
  if (target.part || target.screw || target.sub) { const w = await p.evaluate(() => __game.workView()); if (v !== w && v !== 'loupe' && v !== 'mat') { await p.evaluate((w) => __game.setView(w), w); await idle(); } }
}
const tally = { taps: 0, holds: 0, chip: 0, fallback: 0, actions: 0 };
// Ejecuta la acción sugerida con toques reales; si el punto en pantalla no golpea el objetivo, usa la ruta lógica.
async function real(a, opts = {}) {
  tally.actions++;
  if (a.replace) {
    if (await p.evaluate(() => document.querySelector('#partsPanel').hidden)) await p.tap('#partsBtn');
    await p.tap(`.swap[data-part="${a.replace}"]`);
    tally.taps++; await idle(); return;
  }
  if (a.button) { await ensureView(a); await p.tap(a.button === 'wind' ? '#actionBtn' : '#flipBtn'); tally.taps++; await idle(); return; }
  await tool(a.tool, a.size); const t = a.target;
  if (t.chip) { const pt = await p.evaluate((t) => __game.screenOf(t), t); if (pt) { await p.touchscreen.tap(pt.x, pt.y); tally.chip++; await idle(); return; } }
  await ensureView(t);
  if (t.screw) {
    const pt = await p.evaluate((t) => __game.screenOf(t), t); const hit = await p.evaluate(({ x, y }) => __game.pick(x, y), pt);
    if ((hit.screw || hit.ghost) === t.screw) {
      if (opts.hold) { await p.mouse.move(pt.x, pt.y); await p.mouse.down(); await p.waitForFunction((sid) => { const s = __game.state; return !__game.busy && document.querySelector('#msg').textContent.match(/Tornillo (fuera|puesto)|perdi|resbal|equivocado/i); }, t.screw, { timeout: 60000 }).catch(() => {}); await p.mouse.up(); tally.holds++; await idle(); return; }
      for (let i = 0; i < 6; i++) { const before = await p.evaluate(() => __game.state.screwsOut); await p.touchscreen.tap(pt.x, pt.y); tally.taps++; await idle(); const m = await msg(); if (!/tornillando|izquierdas|repuesto/i.test(m) || (await p.evaluate(() => __game.state.screwsOut)) !== before) break; }
      return;
    }
  } else if (!t.chip) {
    const pt = await p.evaluate((t) => __game.screenOf(t), t);
    if (pt) { const hit = await p.evaluate(({ x, y }) => __game.pick(x, y), pt); const want = t.sub || t.part; if (hit.chain && (hit.chain.includes(want) || (want === 'watch' && hit.chain.includes('watch')))) { await p.touchscreen.tap(pt.x, pt.y); tally.taps++; await idle(); return; } }
  }
  tally.fallback++; await p.evaluate((a) => __game.do(a), a); await idle();
}
async function play(maxSteps, opts = {}) {
  let last = '', same = 0;
  for (let i = 0; i < maxSteps; i++) {
    const s = await st(); if (s.finished) return true;
    const a = await p.evaluate(() => __game.suggest()); if (!a) return false;
    const key = JSON.stringify(a) + s.out.length + s.screwsOut; same = key === last ? same + 1 : 0; last = key;
    if (same > 3) { await p.evaluate((a) => __game.do(a), a); await idle(); tally.fallback++; continue; }
    if (opts.before) await opts.before(a, s);
    if (opts.fast) { await p.evaluate((a) => __game.do(a), a); await idle(); } else await real(a, { hold: opts.hold && a.target && a.target.screw && Math.random() < 0.5 });
    if (opts.onStep) await opts.onStep(i, a, await st());
    if (i % 40 === 39) log(`  · paso ${i + 1}: ${(await st()).goal.text}`);
  }
  return (await st()).finished;
}

// Bucle dentro de la página (misma ruta que los toques: __game.do → handleTap/chipTap/turnScrew), con parada opcional.
async function inPage(stop) {
  return p.evaluate(async (stop) => {
    const g = __game, out = { n: 0, maxOut: 0 };
    for (let i = 0; i < 700; i++) {
      if (g.state.finished) { out.done = true; return out; }
      const a = g.suggest(); if (!a) return out;
      if (stop === 'full' && g.state.out.length > 10 && a.target && a.target.chip && a.tool !== 'oiler') { out.paused = 'full'; return out; }
      if (stop === 'dial' && g.state.out.includes('dial')) { out.paused = 'dial'; return out; }
      const pr = g.do(a); out.n++;
      await new Promise(res => { const iv = setInterval(() => { if (!document.querySelector('#tgPanel').hidden && !document.querySelector('#tgClose').disabled) document.querySelector('#tgClose').click(); }, 40); pr.then(() => { const w = () => (g.busy ? setTimeout(w, 25) : (clearInterval(iv), res())); w(); }); });
      out.maxOut = Math.max(out.maxOut, g.state.out.length);
    }
    return out;
  }, stop);
}
async function open() { await p.goto(URL); await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 90000 }); await p.waitForTimeout(600); }

// ── 0) menú con el logo LA FORY ──
const ONLY = process.env.ONLY || 'all'; const results = {};
await open(); log('WebGL OK:', await p.evaluate(() => __game.glOK));
if (ONLY === 'all') {
await shot('01-menu-lafory.png');
await p.tap('.tab[data-tab="play"]'); await p.waitForTimeout(200); await shot('02-menu-modo-libre.png'); await p.tap('.tab[data-tab="story"]');

// ── 1) Historia · Caso 1 ──
await p.tap('.casecard[data-case="c1"]'); await p.waitForTimeout(900); await idle();
await shot('03-c1-miami-esfera.png'); await tool('screwdriver'); await p.waitForTimeout(300); await shot('03b-hud-atelier.png'); await tool('screwdriver');
{ // diagnóstico con toques reales
  await real({ tool: 'timegrapher', target: { part: 'watch' } });
  await real({ tool: 'compass', target: { part: 'watch' } });
  // orden incorrecto: intentar sacar el volante con el fondo puesto
  await tool('tweezers'); await p.evaluate(() => __game.do({ tool: 'tweezers', target: { part: 'balance' } })); await idle();
  results.wrongOrder = await msg(); log('orden incorrecto →', results.wrongOrder.slice(0, 90));
  let shots = { tray: false, holder: false, screwsOut: false, dial: false, loupe: false };
  let wrongSizeDone = false;
  const ok = await play(400, {
    hold: true,
    onStep: async (i, a, s) => {
      if (!wrongSizeDone && s.out.includes('caseback')) { // primer tornillo: punta demasiado grande y demasiado pequeña
        const sug = await p.evaluate(() => __game.suggest());
        if (sug.target && sug.target.screw) {
          wrongSizeDone = true; await p.evaluate((sid) => __game.setView(__game.workView()), sug.target.screw); await idle();
          await tool('screwdriver', 1.6 === sug.size ? 1.2 : 1.6); const pt = await p.evaluate((t) => __game.screenOf(t), sug.target);
          // demasiado grande o pequeña según el tamaño correcto
          await p.touchscreen.tap(pt.x, pt.y); await idle(); results.wrongSize = await msg(); log('punta incorrecta →', results.wrongSize.slice(0, 100));
          await shot('04-c1-punta-incorrecta.png');
        }
      }
      if (!shots.screwsOut && s.screwsOut >= 3) { shots.screwsOut = true; await shot('05-c1-tornillos-fuera.png'); }
      if (!shots.holder && s.flags.mvLoc === 'holder') { shots.holder = true; await idle(); await shot('06-c1-movimiento-soporte.png'); }
      if (!shots.loupe && (await p.evaluate(() => __game.view)) === 'loupe') { shots.loupe = true; await shot('07-c1-lupa-rubi.png'); }
      if (!shots.tray && s.out.length >= 8) { shots.tray = true; await p.tap('.vbtn[data-view="tray"]'); await idle(); await shot('08-c1-bandeja-piezas.png'); }
      if (!shots.mid && s.fstep >= 3) { shots.mid = true; await shot('09-c1-reparado-montaje.png'); }
    }
  });
  const s = await st(); results.c1 = { ok, score: s.score, stats: s.stats };
  log('Caso 1 completo:', ok, JSON.stringify(s.stats), 'score', s.score);
  await p.waitForTimeout(400); await shot('10-c1-fin-certificado.png');
}
{ // Caso 5 (muelle real): desarme PROFUNDO (soporte, puentes, trinquete, rueda de corona a izquierdas, barrilete) + montaje manual
  await p.evaluate(() => { document.querySelector('#endOverlay').hidden = true; return __game.startStory('c5'); }); await idle();
  const sh = {};
  const ok = await play(500, { hold: true, onStep: async (i, a, s) => {
    if (!sh.wo && s.flags.flipped && s.out.includes('caseback')) { sh.wo = true; await tool('tweezers'); await p.evaluate(() => __game.do({ tool: 'tweezers', target: { part: 'barrel' } })); await idle(); results.wrongOrder2 = await msg(); log('orden incorrecto (barrilete con puentes puestos) →', results.wrongOrder2.slice(0, 100)); }
    if (!sh.holder && s.flags.mvLoc === 'holder') { sh.holder = true; await shot('06-c5-movimiento-en-soporte.png'); }
    if (!sh.loupe && (await p.evaluate(() => __game.view)) === 'loupe') { sh.loupe = true; await shot('07-c5-lupa.png'); }
    if (!sh.tray && s.out.length >= 9) { sh.tray = true; await p.tap('.vbtn[data-view="tray"]'); await idle(); await shot('08-c5-bandeja-terciopelo.png'); await p.evaluate(() => __game.setView(__game.workView())); await idle(); await shot('08b-c5-puentes-fuera.png'); }
    if (!sh.lh && /izquierdas/.test(await msg())) { sh.lh = true; await shot('08c-c5-rosca-izquierdas.png'); }
    if (!sh.re && sh.tray && s.goal.phase === 'Montaje' && s.screwsOut > 0 && /Tornillo puesto/.test(await msg())) { sh.re = true; await shot('09-c5-montaje-atornillando.png'); }
  } });
  const s = await st(); results.c5 = { ok, score: s.score, stats: s.stats };
  log('Caso 5 completo:', ok, JSON.stringify(s.stats), 'score', s.score);
  await p.waitForTimeout(400); await shot('10b-c5-fin-certificado.png');
}
log('Interacción real:', JSON.stringify(tally));
// ── Boutique LA FORY ──
await p.evaluate(() => { document.querySelector('#endOverlay').hidden = true; }); await p.tap('[data-open="boutique"].pill'); await p.waitForFunction(() => __boutique.ready, null, { timeout: 300000 }); await p.waitForTimeout(1200);
await shot('20-boutique-relojes.png');
for (const c of ['herramientas', 'joyeria']) { await p.tap(`.bqnav button[data-cat="${c}"]`); await p.waitForTimeout(1200); await shot(`21-boutique-${c}.png`); }
await p.tap('.vitrine[data-id="j-ring"]'); await p.waitForTimeout(2500); await shot('22-boutique-detalle-anillo.png');
{ const r = await p.evaluate(() => { const c = document.querySelector('#bqStage canvas').getBoundingClientRect(); return { x: c.left + c.width / 2, y: c.top + c.height / 2 }; }); await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x + 120, r.y + 20, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(800); await shot('23-boutique-detalle-anillo-girado.png'); }
await p.tap('#bqBack'); await p.tap('.bqnav button[data-cat="relojes"]'); await p.waitForTimeout(800); await p.tap('.vitrine[data-id="w-cuba"]'); await p.waitForTimeout(2500); await shot('24-boutique-detalle-cuba.png');
results.wallet = await p.evaluate(() => __boutique.wallet.balance);
await p.tap('#bqBack'); await p.tap('#bqClose'); await p.waitForTimeout(300);
} // fin de historia + boutique
// ── 2) Modo libre: cada reloj, sin falla, desarme COMPLETO + montaje ──
for (const [w, n] of [['miami', 11], ['cuba', 12], ['rose', 13]]) {
  await p.evaluate((w) => { document.querySelector('#endOverlay').hidden = true; return __game.startPlay(w, 'sinFalla'); }, w); await idle();
  await shot(`${n}a-libre-${w}-esfera.png`);
  let maxOut = 0, sh = {}, ok;
  await p.evaluate((f) => __game.setSpeed(f ? 0.05 : 0.5), w !== 'rose');
  if (w !== 'rose') {
    const a1 = await inPage('dial'); await p.evaluate(() => __game.setView(__game.workView())); await idle(); await shot(`${n}b-libre-${w}-lado-esfera.png`);
    const a2 = await inPage('full'); maxOut = (await st()).out.length;
    await p.tap('.vbtn[data-view="tray"]'); await idle(); await shot(`${n}c-libre-${w}-bandeja-desarme-completo.png`); await p.tap('.vbtn[data-view="holder"]'); await idle(); await shot(`${n}d-libre-${w}-platina-vacia.png`);
    const a3 = await inPage(null); ok = !!a3.done; log(`  acciones: ${a1.n + a2.n + a3.n}`);
  } else ok = await play(600, {
    before: async (a, s) => {
      if (!sh.full && s.out.length > 10 && a.target && a.target.chip && a.tool !== 'oiler') { sh.full = true; maxOut = s.out.length; await p.tap('.vbtn[data-view="tray"]'); await idle(); await shot(`${n}c-libre-${w}-bandeja-desarme-completo.png`); await p.tap('.vbtn[data-view="holder"]'); await idle(); await shot(`${n}d-libre-${w}-platina-vacia.png`); }
    },
    onStep: async (i, a, s) => {
      maxOut = Math.max(maxOut, s.out.length);
      if (!sh.dial && s.out.includes('dial')) { sh.dial = true; await shot(`${n}b-libre-${w}-lado-esfera.png`); }
    } });
  const s = await st(); const total = await p.evaluate(() => Object.keys(__game.state.out).length);
  const info = await p.evaluate(() => __game.info);
  results[w] = { ok, maxOut, stats: s.stats, info };
  log(`Libre ${w}: completo=${ok} piezas fuera máx=${maxOut}`, JSON.stringify(info));
  await p.waitForTimeout(400); await shot(`${n}e-libre-${w}-fin.png`);
}
// ── 3) rendimiento: FPS con el reloj en marcha (SwiftShader = CPU, sólo orientativo) ──
await p.evaluate(() => { document.querySelector('#endOverlay').hidden = true; return __game.startPlay('miami', 'sinFalla'); }); await p.waitForTimeout(3000);
results.perf = await p.evaluate(() => ({ fps: __game.fps, ...__game.info }));
log('Rendimiento (SwiftShader):', JSON.stringify(results.perf));
log('Interacción real total:', JSON.stringify(tally));
log('Errores de consola:', errs.length ? errs : 'ninguno');
log('Tiempo total', ((Date.now() - T0) / 1000).toFixed(0), 's');
fs.writeFileSync(ROOT + `/shots/results${ONLY === 'all' ? '' : '-' + ONLY}.json`, JSON.stringify({ results, tally, errs }, null, 2));
await b.close();
process.exit(errs.length || (ONLY === 'all' && (!results.c1.ok || !results.c5.ok)) || !['miami', 'cuba', 'rose'].every(w => results[w].ok) ? 1 : 0);
