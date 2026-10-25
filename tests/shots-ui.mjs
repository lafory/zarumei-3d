// Capturas de UI para revisar a ojo: boutique (detalle) y bandeja llena. Uso: node tests/shots-ui.mjs [boutique|tray|all]
import { chromium, webkit } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = ROOT + '/shots/qa/final/'; const what = process.argv[2] || 'all';
const PROF = { phone: { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, desktop: { viewport: { width: 1440, height: 900 } }, ipadL: { viewport: { width: 1194, height: 834 }, hasTouch: true, isMobile: true } };
const eng = process.env.ENGINE === 'chromium' ? chromium : webkit;
const b = await eng.launch(eng === chromium ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
for (const prof of (process.env.PROFILES || 'phone,desktop').split(',')) {
  const p = await (await b.newContext(PROF[prof])).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html?test=1'); await p.waitForFunction(() => window.__game && document.querySelector('#loading').hidden, null, { timeout: 240000 });
  if (what === 'boutique' || what === 'all') {
    for (const id of (process.env.ITEMS || 'w-miami,w-cuba').split(',')) {
      await p.evaluate(() => __boutique.open()); await p.waitForTimeout(1500); await p.evaluate((id) => __boutique.detail(id), id); await p.waitForTimeout(9000);
      await p.screenshot({ path: `${OUT}${prof}-boutique-${id}.png`, timeout: 300000 });
      const top = await p.evaluate(() => { const r = document.querySelector('#bqDetClose').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && e.id; });
      const bb = await p.locator('#bqDetClose').boundingBox(); if (top) await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2).then(() => p.waitForTimeout(800)).catch(e => errs.push('click ✕: ' + e.message.split('\n').slice(-4).join(' / ')));
      console.log(prof, id, '✕ arriba =', top, 'boutique cerrada =', await p.evaluate(() => document.querySelector('#boutique').hidden));
    }
  }
  if (what === 'tray' || what === 'all') {
    for (const w of (process.env.WATCHES || 'cuba').split(',')) {
      await p.evaluate((w) => __game.startPlay(w, 'sinFalla'), w); await p.waitForFunction(() => __game.started && !__game.busy, null, { timeout: 60000 });
      await p.screenshot({ path: `${OUT}${prof}-${w}-inicio.png`, timeout: 300000 });
      const step0 = await p.evaluate(() => document.querySelector('#stepbar')?.innerText);
      await p.evaluate(async () => { const g = __game; g.setSpeed(0.02); for (let i = 0; i < 400; i++) { const s = g.state; const a = g.suggest(); if (!a || /^Montaje/.test(s.goal.phase) || (a.target && a.target.chip)) break; const pr = g.do(a); for (let k = 0; k < 200 && (g.busy || !document.querySelector('#tgPanel').hidden); k++) { const c = document.querySelector('#tgClose'); if (c && !c.disabled && !document.querySelector('#tgPanel').hidden) c.click(); await new Promise(r => setTimeout(r, 20)); } await pr; } });
      await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}${prof}-${w}-desarmado.png`, timeout: 300000 });
      console.log(prof, w, 'inicio:', JSON.stringify(step0).slice(0, 120));
    }
  }
  console.log(prof, 'errores:', errs.join(' | ') || 'ninguno');
}
await b.close();
