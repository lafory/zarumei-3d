// Humo de producción: sin ?test=1 no hay API de pruebas, sin errores de consola ni 404; con ?test=1 sí hay API.
import { chromium, webkit } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.URL || 'file://' + ROOT + '/index.html';
let fail = 0;
for (const [name, bt] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await bt.launch(name === 'chromium' ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('requestfailed', r => errs.push('404 ' + r.url()));
  await p.goto(BASE); await p.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 240000 });
  const prod = await p.evaluate(() => ({ game: typeof window.__game, bq: typeof window.__boutique, title: document.title, og: document.querySelector('meta[property="og:image"]')?.content, brand: /LA FURY/i.test(document.body.innerText) }));
  await p.goto(BASE + '?test=1'); await p.waitForFunction(() => window.__game && document.querySelector('#loading').hidden, null, { timeout: 240000 });
  const test = await p.evaluate(() => typeof window.__game);
  const ok = prod.game === 'undefined' && prod.bq === 'undefined' && test === 'object' && !prod.brand && !errs.length;
  if (!ok) fail++;
  console.log(name, ok ? 'OK' : 'FALLA', JSON.stringify(prod), 'test=' + test, errs.slice(0, 3).join(' | '));
  await b.close();
}
process.exit(fail ? 1 : 0);
