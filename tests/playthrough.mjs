// Prueba E2E en iPhone 13 (Playwright + Chromium/SwiftShader WebGL).
// Juega el Caso 1 completo con TOQUES REALES (raycast) y el modo práctica completo.
import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.URL || 'file://' + ROOT + '/index.html';
const SHOTS = ROOT + '/shots/';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
p.on('requestfailed', r => errs.push('requestfailed: ' + r.url()));
const log = (...a) => console.log(...a);
const idle = async () => { await p.waitForFunction(() => window.__game && (!window.__game.busy || !document.querySelector('#tgPanel').hidden), null, { timeout: 180000 }); await p.waitForTimeout(250); };
const tool = async (id) => { await p.tap(`.tool[data-tool="${id}"]`); await p.waitForTimeout(150); };
const tapPart = async (id) => {
  const pt = await p.evaluate((id) => __game.screenOf(id), id);
  await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(200); await idle();
  return p.evaluate(() => ({ step: __game.step, msg: document.querySelector('#msg').textContent.slice(0, 80) }));
};
const tgClose = async () => { await p.waitForFunction(() => !document.querySelector('#tgClose').disabled && !document.querySelector('#tgPanel').hidden); await p.tap('#tgClose'); await idle(); };
const shot = (n) => p.screenshot({ path: SHOTS + n });

await p.goto(URL);
await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 60000 });
await p.waitForTimeout(800);
log('WebGL OK:', await p.evaluate(() => __game.glOK));
await shot('01-menu.png');
await p.tap('.casecard[data-case="atrasa"]'); await p.waitForTimeout(800);
await shot('02-esfera.png');
// herramienta equivocada
await tool('screwdriver'); log('herramienta incorrecta →', (await tapPart('watch')).msg);
await tool('timegrapher'); { const pt = await p.evaluate(() => __game.screenOf('watch')); await p.touchscreen.tap(pt.x, pt.y); }
await p.waitForTimeout(500); await shot('03-timegrapher-boot.png');
await p.waitForTimeout(1300); await shot('04-timegrapher-antes.png'); await tgClose();
await tool('demag'); log('desmagnetizador →', (await tapPart('watch')).msg);
await tool('compass'); log('brújula →', JSON.stringify(await tapPart('watch')));
// orden incorrecto (rotor antes que el fondo)
await tool('screwdriver'); await p.evaluate(() => __game.tap('rotor')); log('orden incorrecto →', await p.textContent('#msg'));
await shot('05-fondo.png');
 await tool('caseWrench'); await p.waitForTimeout(600); await shot('05b-herramienta-LA-FURY.png');
const seq = [['caseWrench', 'caseback', true], ['screwdriver', 'rotor'], ['screwdriver', 'stem'], ['holder', 'movement'], ['screwdriver', 'auto'], ['tweezers', 'click'], ['screwdriver', 'balscrew'], ['tweezers', 'balance']];
for (const [t, part, pre] of seq) {
  if (!pre) await tool(t); const r = await tapPart(part); log(`${t} → ${part}:`, JSON.stringify(r));
  if (part === 'rotor') { await shot('06-movimiento-en-caja.png'); }
  if (part === 'auto') await shot('07-soporte-sin-automatico.png');
}
await shot('08-lupa-volante.png');
for (const [t, part] of [['loupe', 'jewel'], ['tweezers', 'spring'], ['cleaner', 'jewel'], ['oiler', 'jewel']]) {
  await tool(t); const r = await tapPart(part); log(`${t} → ${part}:`, JSON.stringify(r));
  if (t === 'loupe') await shot('09-falla-aceite-seco.png');
}
await shot('10-aceitado.png');
await p.tap('#actionBtn'); await p.waitForTimeout(500); await idle(); await p.waitForTimeout(500);
await tool('timegrapher'); { const pt = await p.evaluate(() => __game.screenOf('watch')); await p.touchscreen.tap(pt.x, pt.y); }
await p.waitForTimeout(1800); await shot('11-timegrapher-despues.png'); await tgClose();
await p.waitForTimeout(400); await shot('12-fin-tienda.png');
const c1 = await p.evaluate(() => ({ step: __game.step, steps: __game.steps, score: __game.score, end: !document.querySelector('#endOverlay').hidden }));
log('CASO 1:', JSON.stringify(c1));

// Modo práctica (API directa para velocidad)
await p.goto(URL); await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 60000 });
await p.tap('.casecard[data-case="practica"]'); await p.waitForTimeout(300);
await p.tap('#actionBtn'); await idle();
const steps2 = await p.evaluate(() => __game.steps);
for (let guard = 0; guard < 40; guard++) {
  const cur = await p.evaluate(() => ({ s: __game.step, n: __game.steps, c: __game.current, tg: !document.querySelector('#tgPanel').hidden }));
  if (cur.tg) { await tgClose(); continue; }
  if (cur.s >= cur.n) break;
  if (cur.c.button) { await p.tap('#actionBtn'); await p.waitForTimeout(300); await idle(); continue; }
  await p.evaluate(([t, g]) => { __game.selectTool(t); __game.tap(g); }, [cur.c.tool, cur.c.target]); await p.waitForTimeout(200); await idle();
  log('práctica ✔', cur.c.id);
  if (cur.c.id === 'interWheel') await shot('13-practica-desarmado.png');
  if (cur.c.id === 'trainBridge') await shot('12b-practica-tren-de-ruedas.png');
}
await p.waitForTimeout(500);
const c2 = await p.evaluate(() => ({ step: __game.step, steps: __game.steps, end: !document.querySelector('#endOverlay').hidden }));
log('PRÁCTICA:', JSON.stringify(c2));
log('ERRORES JS:', errs.length ? errs : 'ninguno');
await b.close();
process.exit(errs.length || !c1.end || !c2.end ? 1 : 0);
