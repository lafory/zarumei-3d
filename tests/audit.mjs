// Auditoría geométrica + capturas de cada reloj (montado, explotado, cada paso de desarme).
// Uso: node tests/audit.mjs [tag]   → shots/qa/<tag>/...  y  shots/qa/<tag>/audit.json
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAG = process.argv[2] || 'now';
const OUT = ROOT + '/shots/qa/' + TAG + '/'; fs.mkdirSync(OUT, { recursive: true });
const STEPS = process.env.STEPS === '1';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 900, height: 720 } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + ROOT + '/index.html?test=1'); await p.waitForFunction(() => window.__game && document.querySelector('#loading').hidden, null, { timeout: 120000 });
const report = {};
const LIST = (process.env.WATCHES || 'miami,cuba,rose').split(',');
const SHOTS = (process.env.SHOTS || '1-front,4-oblique,6-xray-side').split(',');
for (const w of LIST) {
  await p.evaluate((w) => { __game.setSpeed(0.05); return __game.startPlay(w, 'sinFalla'); }, w);
  await p.evaluate(() => { const st = document.querySelector('#stage'); st.style.position = 'fixed'; st.style.inset = '0'; st.style.zIndex = '50'; window.dispatchEvent(new Event('resize')); });
  await p.waitForTimeout(700);
  // cámara libre a pantalla completa del canvas
  const cam = async (name, pos, tgt, hide = []) => {
    if (!SHOTS.includes(name) && process.env.SHOTS !== 'all') return;
    await p.evaluate(({ pos, tgt, hide }) => {
      const g = __game, T = g._THREE, G = g._G;
      G.CS.body.visible = !hide.includes('case');
      g._controls.enabled = false; g._camera.position.set(...pos); g._controls.target.set(...tgt); g._camera.lookAt(...tgt); g._controls.update();
    }, { pos, tgt, hide });
    await p.waitForTimeout(400);
    await p.evaluate(() => __game._render());
    await p.screenshot({ path: OUT + `${w}-${name}.png`, timeout: 300000 });
  };
  const yF = await p.evaluate(() => __game._G.CS.dims.yFront);
  await cam('1-front', [0, yF + 70, 22], [0, yF, 0]);
  await cam('2-side3', [70, yF + 8, 0], [0, yF, 0]);
  await cam('3-side12', [0, yF + 6, -75], [0, yF, 0]);
  await cam('4-oblique', [45, yF + 45, 45], [0, yF, 0]);
  await cam('5-macro-dial', [0, yF + 34, 9], [0, yF, 0]);
  await cam('6-xray-side', [62, yF + 4, 0], [0, yF - 1, 0], ['case']);
  // métricas geométricas
  const m = await p.evaluate(() => {
    const g = __game, T = g._THREE, G = g._G, out = { issues: [], info: {} };
    G.root.updateMatrixWorld(true);
    const box = (o, filt = () => true) => { const b = new T.Box3(); o.updateMatrixWorld(true); o.traverse(c => { if (c.isMesh && !c.userData.isHit && !c.userData.screwGhost && c.visible !== false && filt(c)) { let vis = true; for (let n = c; n; n = n.parent) { if (n.userData.screwGhost) vis = false; } if (!vis) return; c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld)); } }); return b; };
    const r3 = (v) => Math.round(v * 100) / 100;
    const W = G.W, k = W.case.r / 20;
    for (const cp of G.cal.parts) { const o = G.parts[cp.id]; let inScene = false; for (let n = o; n; n = n.parent) if (n === g._scene) inScene = true; if (!o || !inScene) out.issues.push(`pieza ${cp.id} no existe en la escena`); }
    // cristal y caja (cuerpo fusionado: buscamos por material)
    let crystal = null; G.CS.body.traverse(c => { if (c.isMesh && c.material === G.MV && 0) {} if (c.isMesh && c.renderOrder === 5) crystal = c; });
    const cb = crystal ? box(crystal) : null;
    out.info.crystal = cb && { minY: r3(cb.min.y), maxY: r3(cb.max.y), r: r3((cb.max.x - cb.min.x) / 2) };
    const hands = ['hourHand', 'minHand', 'secHand'].map(id => { const b = box(G.parts[id]); return { id, minY: r3(b.min.y), maxY: r3(b.max.y), pivot: (() => { const v = new T.Vector3(); G.parts[id].getWorldPosition(v); return [r3(v.x), r3(v.z)]; })() }; });
    out.info.hands = hands;
    const dial = box(G.parts.dial); out.info.dial = { minY: r3(dial.min.y), maxY: r3(dial.max.y), r: r3((dial.max.x - dial.min.x) / 2), cx: r3((dial.max.x + dial.min.x) / 2), cz: r3((dial.max.z + dial.min.z) / 2) };
    const innerR = (W.case.style === 'diver' ? 16.3 : 15.4) * k;
    out.info.caseInnerR = r3(innerR);
    if (out.info.dial.r > innerR + 0.05) out.issues.push(`esfera Ø${(out.info.dial.r * 2).toFixed(1)} > hueco de caja Ø${(innerR * 2).toFixed(1)} (atraviesa la carrura)`);
    const topHand = Math.max(...hands.map(h => h.maxY));
    if (cb && topHand > cb.min.y - 0.05) out.issues.push(`agujas (y=${topHand.toFixed(2)}) tocan/atraviesan el cristal (y=${cb.min.y.toFixed(2)})`);
    for (const h of hands) { if (Math.hypot(h.pivot[0], h.pivot[1]) > 0.05) out.issues.push(`${h.id} descentrada ${h.pivot}`); if (h.minY < dial.max.y - 0.35) out.issues.push(`${h.id} atraviesa la esfera/índices`); }
    // movimiento dentro de la caja
    const mv = box(G.mvObj, c => { for (let n = c; n; n = n.parent) if (n.name === 'stem') return false; return true; });
    out.info.mv = { rXZ: r3(Math.max(mv.max.x, -mv.min.x, mv.max.z, -mv.min.z)), minY: r3(mv.min.y), maxY: r3(mv.max.y) };
    const cbk = box(G.parts.caseback); out.info.caseback = { minY: r3(cbk.min.y), maxY: r3(cbk.max.y) };
    if (mv.min.y < cbk.max.y - 0.05) out.issues.push(`movimiento (y=${mv.min.y.toFixed(2)}) atraviesa el fondo (y=${cbk.max.y.toFixed(2)})`);
    // corona
    const crown = G.parts.stem; const cbx = box(crown); out.info.stem = { minX: r3(cbx.min.x), maxX: r3(cbx.max.x), minY: r3(cbx.min.y), maxY: r3(cbx.max.y) };
    const caseB = box(G.CS.body, c => c.renderOrder !== 5); out.info.case = { minY: r3(caseB.min.y), maxY: r3(caseB.max.y) };
    // piezas fuera de la platina
    const R = G.MV.R; const mvInv = new T.Matrix4().copy(G.mvObj.matrixWorld).invert();
    for (const [id, o] of Object.entries(G.parts)) {
      if (['movement', 'caseback', 'stem', 'clamps', 'rotor', 'dial', 'hourHand', 'minHand', 'secHand'].includes(id)) continue;
      const b = new T.Box3(); o.traverse(c => { if (c.isMesh && !c.userData.isHit && c.visible) { let gh = false; for (let n = c; n; n = n.parent) if (n.userData.screwGhost || n.userData.screwId) gh = true; if (gh) return; c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(mvInv, c.matrixWorld))); } });
      if (b.isEmpty()) continue;
      // radio máximo del contorno (en el marco del movimiento)
      let rmax = 0; o.traverse(c => { if (c.isMesh && !c.userData.isHit && c.visible && c.geometry.attributes.position) { let gh = false; for (let n = c; n; n = n.parent) if (n.userData.screwGhost || n.userData.screwId) gh = true; if (gh) return; const pos = c.geometry.attributes.position, M4 = new T.Matrix4().multiplyMatrices(mvInv, c.matrixWorld), v = new T.Vector3(); for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i).applyMatrix4(M4); rmax = Math.max(rmax, Math.hypot(v.x, v.z)); } } });
      if (rmax > R + 0.15) out.issues.push(`${id} sale de la platina: r=${rmax.toFixed(2)} > R=${R}`);
    }
    // tornillos asentados
    const ray = new T.Raycaster(); out.info.screws = [];
    for (const [sid, s] of Object.entries(G.MV.screws)) {
      const o = s.obj; o.updateMatrixWorld(true); const pos = new T.Vector3(); o.getWorldPosition(pos); const up = new T.Vector3(0, 1, 0).applyQuaternion(o.getWorldQuaternion(new T.Quaternion())).normalize();
      const targets = []; if (sid.startsWith('dial#')) targets.push(G.mvObj.children[0]); s.host.traverse(c => { if (c.isMesh && !c.userData.isHit) { for (let n = c; n; n = n.parent) if (n.userData.screwId || n.userData.screwGhost) return; targets.push(c); } });
      // si el anfitrión es fino, el tornillo también puede apoyar sobre la platina
      ray.set(pos.clone().add(up.clone().multiplyScalar(3)), up.clone().negate()); ray.far = 8;
      const h = ray.intersectObjects(targets, false)[0];
      const gap = h ? h.distance - 3 : null;
      const rec = { sid, gap: gap == null ? null : r3(gap) }; out.info.screws.push(rec);
      if (gap == null) out.issues.push(`tornillo ${sid} flota (no hay ${s.host.name} debajo)`);
      else if (gap > 0.2) out.issues.push(`tornillo ${sid} flota ${gap.toFixed(2)} mm sobre ${s.host.name}`);
      else if (gap < -0.25) out.issues.push(`tornillo ${sid} hundido ${(-gap).toFixed(2)} mm en ${s.host.name}`);
    }
    return out;
  });
  report[w] = m;
  console.log(`\n== ${w} ==`); console.log(JSON.stringify(m.info, (k, v) => k === 'screws' ? undefined : v)); m.issues.forEach(i => console.log('  ✗ ' + i));
}
fs.writeFileSync(OUT + 'audit.json', JSON.stringify(report, null, 1));
console.log('errores consola:', errs.length, errs.slice(0, 5));
await b.close();
