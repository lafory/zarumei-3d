// Pruebas multi-dispositivo: iPhone 13, iPad Pro 11 (vertical y horizontal), escritorio 1440×900 — Chromium y WebKit.
// Para cada uno: carga sin errores, captura menú / banco / boutique, juega el Caso 1 hasta el final (misma ruta que los toques).
// En escritorio además: hover, atajos de teclado, arrastrar con botón derecho, mantener clic sobre un tornillo.
import { chromium, webkit, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.env.URL || 'file://' + ROOT + '/index.html';
const OUT = ROOT + '/shots/devices/'; fs.mkdirSync(OUT, { recursive: true });
const PROFILES = [
  ['iphone13', devices['iPhone 13']],
  ['ipadpro11-vertical', devices['iPad Pro 11']],
  ['ipadpro11-horizontal', devices['iPad Pro 11 landscape']],
  ['desktop-1440x900', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }]
];
const ENGINES = (process.env.ENGINES || 'chromium,webkit').split(',');
const results = [];
for (const eng of ENGINES) {
  const bt = eng === 'webkit' ? webkit : chromium;
  let b; try { b = await bt.launch(eng === 'chromium' ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {}); } catch (e) { results.push({ eng, error: 'no se pudo lanzar: ' + e.message.split('\n')[0] }); continue; }
  for (const [name, prof] of PROFILES) {
    const t0 = Date.now(); const r = { eng, name, errors: [] };
    const ctx = await b.newContext({ ...prof }); const p = await ctx.newPage();
    p.on('pageerror', e => r.errors.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') r.errors.push('console: ' + m.text()); });
    const shot = (n) => p.screenshot({ path: `${OUT}${eng}-${name}-${n}.png`, timeout: 240000 });
    const touch = !!prof.hasTouch; const press = (sel) => touch ? p.tap(sel) : p.click(sel);
    try {
      await p.goto(URL); await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 240000 });
      r.webgl = await p.evaluate(() => __game.glOK); await p.waitForTimeout(600); await shot('1-menu');
      await press('.casecard[data-case="c1"]'); await p.waitForFunction(() => __game.started && !__game.busy, null, { timeout: 120000 });
      await press('.tool[data-tool="screwdriver"]'); await p.waitForTimeout(500);
      r.dpr = await p.evaluate(() => __game.dpr); r.layout = await p.evaluate(() => { const s = document.querySelector('#stage').getBoundingClientRect(), t = document.querySelector('#tools').getBoundingClientRect(); return { stage: [Math.round(s.width), Math.round(s.height)], side: t.left > s.right - 5 }; });
      await shot('2-banco');
      if (!touch) { // ratón + teclado
        const c = await p.evaluate(() => { const s = __game.screenOf({ part: 'watch' }); return s; });
        await p.keyboard.press('Digit1'); r.key1 = await p.evaluate(() => document.querySelector('.tool.sel')?.dataset.tool);
        await p.keyboard.press('Digit1');
        await p.mouse.move(c.x + 30, c.y + 10); await p.mouse.move(c.x, c.y, { steps: 4 }); await p.waitForTimeout(400); r.hover = await p.evaluate(() => __game.hovered);
        await p.keyboard.press('KeyF'); await p.waitForFunction(() => !__game.busy); await p.waitForTimeout(300); { const cb = await p.evaluate(() => __game.screenOf({ part: 'caseback' })); await p.mouse.move(cb.x + 20, cb.y); await p.mouse.move(cb.x, cb.y, { steps: 3 }); await p.waitForTimeout(400); r.hoverPart = await p.evaluate(() => __game.hovered); r.flipKey = await p.evaluate(() => __game.state.flags.flipped); }
        await p.mouse.move(c.x, c.y); await p.mouse.down({ button: 'right' }); await p.mouse.move(c.x + 80, c.y + 40, { steps: 6 }); await p.mouse.up({ button: 'right' }); await p.waitForTimeout(300);
        await p.mouse.move(c.x, c.y); await p.mouse.wheel(0, -300); await p.waitForTimeout(300); await shot('2b-banco-raton-hover');
        await p.keyboard.press('KeyH'); r.hintKey = /💡/.test(await p.evaluate(() => document.querySelector('#msg').textContent));
        await p.keyboard.press('Escape'); r.escMenu = await p.evaluate(() => !document.querySelector('#intro').hidden); await p.keyboard.press('Escape');
        r.fsSupported = await p.evaluate(() => __game.fsSupported);
      }
      // Caso 1 completo por la ruta de juego (incluye tornillos uno a uno, montaje manual y timegrapher)
      const out = await p.evaluate(async () => {
        const g = __game; g.setSpeed(0.05); let n = 0;
        for (let i = 0; i < 300; i++) {
          if (g.state.finished) break; const a = g.suggest(); if (!a) break;
          const pr = g.do(a); n++;
          await new Promise(res => { const iv = setInterval(() => { if (!document.querySelector('#tgPanel').hidden && !document.querySelector('#tgClose').disabled) document.querySelector('#tgClose').click(); }, 40); pr.then(() => { const w = () => (g.busy ? setTimeout(w, 25) : (clearInterval(iv), res())); w(); }); });
          if (n === 12) { window.__mid = true; }
        }
        return { n, finished: g.state.finished, score: g.state.score };
      });
      r.case1 = out; await p.waitForTimeout(500); await shot('3-caso1-fin');
      await p.evaluate(() => { document.querySelector('#endOverlay').hidden = true; __boutique.open(); }); await p.waitForFunction(() => __boutique.ready, null, { timeout: 300000 }); await p.waitForTimeout(1200); await shot('4-boutique');
      await p.evaluate(() => __boutique.detail('j-ring')); await p.waitForTimeout(2000); await shot('5-boutique-detalle');
    } catch (e) { r.errors.push('test: ' + e.message.split('\n')[0]); }
    r.secs = Math.round((Date.now() - t0) / 1000); r.ok = !r.errors.length && r.case1 && r.case1.finished;
    console.log(JSON.stringify(r)); results.push(r); await ctx.close();
  }
  await b.close();
}
fs.writeFileSync(OUT + 'results.json', JSON.stringify(results, null, 2));
process.exit(results.every(r => r.ok) ? 0 : 1);
