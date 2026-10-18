// Regresión (bug «bucle del protector de esfera»): con TOQUES REALES en iPhone 13, para Miami, Cuba y Rosé:
//   protector puesto → palancas sobre segundero, minutero y horario (el protector sigue puesto) → retirar protector →
//   … montaje: protector puesto → prensa: horario, minutero, segundero → retirar protector → terminar el reloj.
// Comprueba además que el raycast sobre cada aguja devuelve la aguja (el protector no la tapa) y que no hay errores de consola.
import { chromium, webkit, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.URL || 'file://' + ROOT + '/index.html';
const OUT = ROOT + '/shots/protector/'; fs.mkdirSync(OUT, { recursive: true });
const bt = process.env.ENGINE === 'webkit' ? webkit : chromium;
const b = await bt.launch(bt === chromium ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(URL); await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 240000 });
const msg = () => p.evaluate(() => document.querySelector('#msg').textContent);
const idle = async () => { for (;;) { const s = await p.evaluate(() => ({ busy: __game.busy, tg: !document.querySelector('#tgPanel').hidden, ok: !document.querySelector('#tgClose').disabled })); if (s.tg && s.ok) { await p.tap('#tgClose'); continue; } if (!s.busy && !s.tg) return; await p.waitForTimeout(80); } };
const tool = async (id) => { const cur = await p.evaluate(() => document.querySelector('.tool.sel')?.dataset.tool || null); if (cur !== id) { await p.tap(`.tool[data-tool="${id}"]`); await p.waitForTimeout(80); } };
// avanza dentro de la página (misma ruta que los toques) hasta que el planificador pida el protector
const until = (pred) => p.evaluate(async (pred) => { const g = __game; const f = new Function('a', 's', 'return ' + pred);
  for (let i = 0; i < 500; i++) { if (g.state.finished) return 'finished'; const a = g.suggest(); if (!a) return 'none'; if (f(a, g.state)) return 'stop';
    const pr = g.do(a); await new Promise(res => { const iv = setInterval(() => { if (!document.querySelector('#tgPanel').hidden && !document.querySelector('#tgClose').disabled) document.querySelector('#tgClose').click(); }, 40); pr.then(() => { const w = () => (g.busy ? setTimeout(w, 25) : (clearInterval(iv), res())); w(); }); }); }
  return 'steps'; }, pred);
const tapObj = async (target) => { await p.evaluate(() => __game.setView(__game.workView())); await idle(); const pt = await p.evaluate((t) => __game.screenOf(t), target); const hit = await p.evaluate(({ x, y }) => __game.pick(x, y), pt); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(120); await idle(); return hit; };
const results = {}; let fail = [];
for (const w of ['miami', 'cuba', 'rose']) {
  const r = { steps: [] }; results[w] = r; const check = (ok, what) => { r.steps.push((ok ? '✓ ' : '✗ ') + what); if (!ok) fail.push(`${w}: ${what}`); };
  await p.evaluate((w) => { document.querySelector('#endOverlay').hidden = true; return __game.startPlay(w, 'sinFalla'); }, w); await idle(); await p.evaluate(() => __game.setSpeed(0.05));
  check(await until("a.tool === 'dialProtector'") === 'stop', 'llegar al desmontaje de agujas');
  // 1) protector puesto (toque real en la esfera)
  await tool('dialProtector'); await tapObj({ part: 'dial' });
  check(await p.evaluate(() => __game.state.flags.protector), 'protector puesto');
  await p.screenshot({ path: `${OUT}${w}-1-protector-puesto.png`, timeout: 240000 });
  // 2) palancas sobre cada aguja con el protector puesto
  for (const h of ['secHand', 'minHand', 'hourHand']) {
    await tool('handLevers'); const hit = await tapObj({ part: h });
    check(!!(hit.chain && hit.chain.includes(h)), `raycast a ${h} (no lo tapa el protector)`);
    const s = await p.evaluate(() => __game.state); const m = await msg();
    check(s.out.includes(h) && s.flags.protector, `${h} fuera con protector puesto`);
    check(!/Quita el .*protector/i.test(m), `sin mensaje «quita el protector» (${m.slice(0, 50)})`);
  }
  await p.screenshot({ path: `${OUT}${w}-2-agujas-fuera.png`, timeout: 240000 });
  // 3) el planificador pide retirarlo; toque real
  check(JSON.stringify(await p.evaluate(() => __game.suggest())).includes('dialProtector'), 'pista: retirar protector');
  await tool('dialProtector'); await tapObj({ part: 'dial' });
  check(!(await p.evaluate(() => __game.state.flags.protector)), 'protector retirado tras las agujas');
  // 4) montaje: hasta que vuelva a pedir el protector para clavar agujas
  check(await until("a.tool === 'dialProtector' && s.out.includes('hourHand')") === 'stop', 'montaje hasta clavar agujas');
  await tool('dialProtector'); await tapObj({ part: 'dial' });
  check(await p.evaluate(() => __game.state.flags.protector), 'protector puesto para clavar agujas');
  for (const h of ['hourHand', 'minHand', 'secHand']) {
    await tool('handPress'); const pt = await p.evaluate((t) => __game.screenOf(t), { chip: h }); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(120); await idle();
    check(!(await p.evaluate(() => __game.state)).out.includes(h), `${h} clavada con la prensa`);
  }
  await p.screenshot({ path: `${OUT}${w}-3-agujas-clavadas.png`, timeout: 240000 });
  await tool('dialProtector'); await tapObj({ part: 'dial' });
  check(!(await p.evaluate(() => __game.state.flags.protector)), 'protector retirado antes de encajar el movimiento');
  check(await until('false') === 'finished', 'reloj terminado');
  r.score = (await p.evaluate(() => __game.state)).score;
  console.log(w, r.score, r.steps.filter(x => x.startsWith('✗')).length ? 'FALLA' : 'OK'); r.steps.forEach(x => console.log('   ', x));
}
console.log('Errores de consola:', errs.length ? errs : 'ninguno');
fs.writeFileSync(OUT + 'results.json', JSON.stringify({ results, errs, fail }, null, 2));
await b.close(); process.exit(fail.length || errs.length ? 1 : 0);
