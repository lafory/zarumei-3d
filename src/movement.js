// Movimientos procedurales: ZR-28 (automático tipo 2824/SW200) y ZQ-11 (cuarzo fino tipo Ronda 762 / Miyota GL20).
// Coordenadas locales del movimiento: lado puentes = +Y, la tija sale por −X. El grupo dialSide está girado
// 180° en Z, así que dentro de él las coordenadas coinciden con las del reloj (esfera = +Y, 12h = −Z, 3h = +X).
import * as THREE from 'three';
import * as TX from './textures.js';
import { extrudeShape, polyShape, gearShape, gearMesh, ringShape, hitProxy, boxHit, tag, at, cyl, jewelMesh, shadowAll, screwMesh } from './geom.js';
import { buildDial, buildHands } from './dialside.js';

export function screwsFor(M, cal, parts) {
  const out = {};
  for (const p of cal.parts) (p.screws || []).forEach((s, i) => {
    const host = parts[p.id]; if (!host) return;
    const sid = `${p.id}#${i}`;
    const g = screwMesh(M, s.s); g.userData.screwId = sid; g.name = sid;
    const hp = hitProxy(M, Math.max(0.95, s.s * 0.9), 1.0, 0.3); hp.userData.screwId = sid; g.add(hp);
    const ghost = screwMesh(M, s.s, true); ghost.userData.screwGhost = sid; ghost.visible = false;
    // El agujero es pequeño: el toque acepta un área más ancha para poder volver a meter el tornillo.
    const gh = hitProxy(M, Math.max(2.2, s.s * 1.7), 1.8, 0.45); gh.userData.screwGhost = sid; ghost.add(gh);
    for (const o of [g, ghost]) {
      o.position.set(...s.p);
      if (s.face) o.scale.setScalar(1.7);
      if (s.radial) {
        const d = new THREE.Vector3(s.p[0], 0, s.p[2]);
        if (d.lengthSq() > 1e-8) {
          d.normalize();
          o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
          o.rotateOnAxis(new THREE.Vector3(0, 1, 0), (i * 1.7) % 3);
        }
      } else o.rotation.y += (i * 1.7) % 3;
      host.add(o);
    }
    if (s.face) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(s.s * 1.15, 0.16, 6, 20).rotateX(Math.PI / 2), M.goldChaton);
      ring.position.y = 0.02;
      g.add(ring);
      g.traverse(o => { if (o.isMesh && !o.userData.isHit) o.renderOrder = 6; });
    }
    out[sid] = { obj: g, ghost, host };
  });
  return out;
}
export function stemGroup(M, R, metal, y, crownR = 3.1, crownL = 3.6) {
  const stem = tag(new THREE.Group(), 'stem');
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 9.6, 12).rotateZ(Math.PI / 2), M.steel); rod.position.set(-R - 3.6, 0, 0); stem.add(rod);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(crownR, crownR, crownL, 28).rotateZ(Math.PI / 2), metal); crown.position.set(-R - 6.6 - crownL / 2 - 1, 0, 0); stem.add(crown);
  for (let k = 0; k < 16; k++) { const fl = new THREE.Mesh(new THREE.BoxGeometry(crownL * 0.9, 0.22, 0.22), metal); const a = k / 16 * Math.PI * 2; fl.position.set(crown.position.x, Math.cos(a) * crownR, Math.sin(a) * crownR); stem.add(fl); }
  stem.add(at(hitProxy(M, crownR + 0.4, crownL + 1).rotateZ(Math.PI / 2), crown.position.x, 0, 0));
  const push = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 16), M.steel); push.position.set(-R + 3.0, y > 0.6 ? 0.8 : 0.5, 2.6); stem.add(push);
  stem.add(at(hitProxy(M, 1.6, 1.0), -R + 3.0, 0.8, 2.6));
  stem.position.y = y; return stem;
}

// ───────────────────────── ZR-28 ─────────────────────────
// Protector de esfera: lámina plástica con ranura que se desliza SOBRE la esfera y BAJO las agujas
// (las palancas apoyan en ella). Nunca intercepta los toques (noPick) para no tapar las agujas.
export function makeProtector(M, watch, ys) {
  if (watch.dial.kind === 'recta') {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(20.4, 13.6).rotateX(-Math.PI / 2), M.protector);
    m.position.y = ys.dial + 1.98; m.visible = false; m.renderOrder = 3; m.userData.noPick = true; m.raycast = () => {};
    return m;
  }
  const g = new THREE.RingGeometry(1.1, watch.dial.r - 0.6, 64, 1, 0.12, Math.PI * 2 - 0.24).rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, M.protector); m.position.y = ys.dial + 0.06; m.visible = false; m.renderOrder = 2; m.userData.noPick = true; m.raycast = () => {};
  return m;
}
export function buildZR28(M, images, watch, cal) {
  const R = 12.8;
  const mv = tag(new THREE.Group(), 'movement'); const parts = {}; const sub = {};
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.2, 96), [M.darkSteel, M.plate, M.plate]); plate.position.y = 0.6; mv.add(plate);
  for (const [x, z] of [[2, 2], [-3, 4], [6, -1], [-6.5, 6.5], [9.5, -1.5]]) mv.add(at(jewelMesh(M, 0.35), x, 1.2, z));
  const wheels = [['secondWheel', 0, 0, 3.4, 60], ['thirdWheel', 5.4, -3.8, 2.8, 50], ['escapeWheel', 6.9, 1.6, 2.0, 20], ['interWheel', 2.6, -7.0, 2.4, 44]];
  for (const [id, x, z, r, n] of wheels) {
    const w = tag(new THREE.Group(), id);
    w.add(gearMesh(r, n, 0.18, M.goldWheel, id === 'escapeWheel' ? 0 : 4));
    const pin = new THREE.Mesh(gearMesh(0.6, 8, 0.5, M.steel, 0).geometry, M.steel); pin.position.y = -0.3; w.add(pin);
    w.add(at(cyl(0.22, 1.2, M.steel, 10), 0, -0.2, 0));
    w.add(hitProxy(M, r + 0.3, 0.6, 0.3));
    at(w, x, 1.35, z); mv.add(w); parts[id] = w;
  }
  const barrel = tag(new THREE.Group(), 'barrel');
  barrel.add(new THREE.Mesh(extrudeShape(gearShape(5.0, 80, 0.6, 0), 0.7, 0.03, 16), M.goldWheel));
  const drumMat = M.steel.clone(); const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.7, 0.72, 48), drumMat); drum.position.y = 0.36; barrel.add(drum);
  const spr = []; for (let t = 0; t < 14 * Math.PI; t += 0.2) { const r = 1.0 + t * 0.075; spr.push(new THREE.Vector3(Math.cos(t) * r, 0.75, Math.sin(t) * r)); }
  const mainspring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spr), 300, 0.06, 4), new THREE.MeshStandardMaterial({ color: 0x5b4a3a, metalness: 0.7, roughness: 0.6 })); mainspring.visible = false; barrel.add(mainspring);
  barrel.add(hitProxy(M, 5.2, 0.8, 0.4)); at(barrel, -4.6, 1.25, -5.0); mv.add(barrel); parts.barrel = barrel; sub.barrelDrum = drum; sub.mainspring = mainspring;
  const bbShape = new THREE.Shape(); bbShape.moveTo(-12.4, -2.0); bbShape.absarc(0, 0, 12.4, Math.PI + 0.16, Math.PI * 1.5 - 0.02, false);
  bbShape.lineTo(1.2, -11.6); bbShape.quadraticCurveTo(1.6, -4.2, -1.0, -1.4); bbShape.quadraticCurveTo(-6, 1.4, -12.4, -2.0);
  const bb = tag(new THREE.Group(), 'barrelBridge'); bb.add(new THREE.Mesh(extrudeShape(bbShape, 0.8), M.bridge)); bb.add(at(jewelMesh(M, 0.4), -4.6, 0.8, -5.0)); at(bb, 0, 2.0, 0); mv.add(bb); parts.barrelBridge = bb;
  const ratchet = tag(new THREE.Group(), 'ratchet'); ratchet.add(new THREE.Mesh(extrudeShape(gearShape(3.5, 46, 0, 0), 0.35, 0.02, 12), M.steel)); ratchet.add(hitProxy(M, 3.7, 0.6, 0.3)); at(ratchet, -4.6, 2.85, -5.0); mv.add(ratchet); parts.ratchet = ratchet;
  const cw = tag(new THREE.Group(), 'crownWheel'); cw.add(new THREE.Mesh(extrudeShape(gearShape(1.7, 22, 0, 0), 0.3, 0.02, 12), M.steel)); cw.add(hitProxy(M, 2.0, 0.6, 0.3)); at(cw, -9.6, 2.85, -1.6); mv.add(cw); parts.crownWheel = cw;
  const click = tag(new THREE.Group(), 'click'); click.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.6, 0.5], [2.4, 1.6], [0.6, 1.4], [-0.3, 0.8]]), 0.3, 0.02), M.steel));
  const cs = []; for (let t = 0; t < 3.2; t += 0.2) cs.push(new THREE.Vector3(-0.4 - t * 0.6, 0.15, 1.8 + Math.sin(t * 2) * 0.3)); click.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cs), 30, 0.07, 4), M.steel));
  click.add(hitProxy(M, 1.8, 0.6, 0.3)); at(click, -1.6, 2.85, -9.4); mv.add(click); parts.click = click;
  const tbShape = new THREE.Shape(); tbShape.moveTo(1.6, -11.6); tbShape.absarc(0, 0, 12.4, Math.PI * 1.5 + 0.13, Math.PI * 2 + 0.25, false);
  tbShape.lineTo(9.8, 4.4); tbShape.quadraticCurveTo(3.6, 3.4, 0.6, 1.4); tbShape.quadraticCurveTo(2.2, -4.6, 1.6, -11.6);
  const tb = tag(new THREE.Group(), 'trainBridge'); tb.add(new THREE.Mesh(extrudeShape(tbShape, 0.8), M.bridge));
  for (const [x, z] of [[5.4, -3.8], [6.9, 1.6], [2.6, -7.0]]) tb.add(at(jewelMesh(M, 0.38), x, 0.8, z)); at(tb, 0, 2.0, 0); mv.add(tb); parts.trainBridge = tb;
  const pf = tag(new THREE.Group(), 'palletFork');
  pf.add(new THREE.Mesh(extrudeShape(polyShape([[-0.3, -2.2], [0.3, -2.2], [0.25, 0.4], [1.3, 0.9], [1.1, 1.3], [0, 0.8], [-1.1, 1.3], [-1.3, 0.9], [-0.25, 0.4]]), 0.15, 0.01), M.steel));
  for (const sx of [1.2, -1.2]) pf.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.5), M.ruby), sx, 0.1, 1.05));
  pf.add(hitProxy(M, 1.6, 0.5, 0.2)); pf.rotation.y = -0.6; at(pf, 4.6, 1.4, 4.4); mv.add(pf); parts.palletFork = pf;
  const pb = tag(new THREE.Group(), 'palletBridge'); pb.add(new THREE.Mesh(extrudeShape(polyShape([[1.6, 3.0], [6.4, 2.8], [7.0, 4.5], [2.4, 5.2]]), 0.7), M.bridge)); pb.add(at(jewelMesh(M, 0.32), 4.4, 0.7, 4.0)); at(pb, 0, 2.0, 0); mv.add(pb); parts.palletBridge = pb;
  // volante + espiral + puente con amortiguador, raqueta (regulador) y pivote
  const BX = 4.6, BZ = 8.6;
  const balance = tag(new THREE.Group(), 'balance');
  const wheel = new THREE.Group(); wheel.name = 'balanceWheel';
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.3, 10, 48).rotateX(Math.PI / 2), M.goldWheel));
  for (let k = 0; k < 3; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 0.4), M.goldWheel); arm.position.x = 1.55; const p = new THREE.Group(); p.add(arm); p.rotation.y = k * Math.PI * 2 / 3; wheel.add(p); }
  for (let k = 0; k < 8; k++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8).rotateZ(Math.PI / 2), M.goldWheel); const a = k / 8 * Math.PI * 2; sc.position.set(Math.cos(a) * 3.55, 0, Math.sin(a) * 3.55); sc.rotation.y = -a; wheel.add(sc); }
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 10), M.steel); staff.position.y = 0.5; wheel.add(staff);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), M.steel); pivot.position.y = 1.7; pivot.name = 'pivot'; wheel.add(pivot);
  const pts = []; for (let t = 0; t < 12 * Math.PI; t += 0.12) { const r = 0.5 + t * 0.062; pts.push(new THREE.Vector3(Math.cos(t) * r, 0.45, Math.sin(t) * r)); }
  wheel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.035, 4, false), M.blueSpring));
  wheel.position.y = -0.35; balance.add(wheel);
  const cockShape = new THREE.Shape(); cockShape.moveTo(-1.8, -0.6); cockShape.quadraticCurveTo(0, -2.0, 1.8, -0.6); cockShape.lineTo(5.2, -3.8); cockShape.lineTo(6.0, -2.0); cockShape.lineTo(2.0, 1.4); cockShape.quadraticCurveTo(0, 2.2, -1.8, 0.6); cockShape.closePath();
  const cock = new THREE.Mesh(extrudeShape(cockShape, 0.6), M.bridge); cock.position.y = 0.6; balance.add(cock);
  const setting = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.3, 32), M.steel); setting.position.y = 1.35; balance.add(setting);
  const jewel = tag(new THREE.Group(), 'jewel');
  jewel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 32), M.ruby));
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.05, 24), M.dirtyOil.clone()); dirt.position.y = 0.1; dirt.visible = false; jewel.add(dirt);
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24), M.cleanOil); oil.position.y = 0.1; oil.visible = false; jewel.add(oil);
  jewel.add(hitProxy(M, 0.85, 0.4, 0.1)); jewel.position.y = 1.56; balance.add(jewel);
  const lyrePts = [[-1.2, 0.0], [-0.9, -0.95], [0, -1.25], [0.9, -0.95], [1.2, 0]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const spring = tag(new THREE.Group(), 'spring'); const lyre = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lyrePts), 30, 0.09, 6), M.steel); spring.add(lyre);
  const lyre2 = lyre.clone(); lyre2.rotation.y = Math.PI; spring.add(lyre2);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.9), M.steel); hinge.position.x = -1.25; spring.add(hinge); spring.add(at(hitProxy(M, 0.5, 0.4), -1.3, 0, 0));
  spring.position.y = 1.62; balance.add(spring);
  const regulator = tag(new THREE.Group(), 'regulator');
  regulator.add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.35).translate(1.6, 0, 0), M.steel));
  regulator.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.9), M.steel), 3.2, 0, 0));
  regulator.add(at(boxHit(M, 2.0, 0.6, 1.4), 2.6, 0, 0)); regulator.position.set(0, 1.25, -0.2); regulator.rotation.y = 0.4; balance.add(regulator);
  // índice +/− grabado
  const idx = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.8), M.darkSteel); idx.position.set(3.4, 1.22, -1.6); balance.add(idx);
  balance.add(hitProxy(M, 3.6, 1.6, 0.4)); at(balance, BX, 2.0, BZ); mv.add(balance); parts.balance = balance;
  Object.assign(sub, { jewel, spring, regulator, dirt, oil, pivot, wheel, staff });
  // módulo automático
  const auto = tag(new THREE.Group(), 'auto');
  const aShape = new THREE.Shape(); aShape.moveTo(-10.6, -4.5); aShape.quadraticCurveTo(-6, -12, 2, -11.9); aShape.quadraticCurveTo(9.8, -10.8, 10.6, -4); aShape.quadraticCurveTo(9.6, 1.4, 3.4, 2.2); aShape.quadraticCurveTo(-4.5, 3.0, -10.6, -4.5);
  auto.add(new THREE.Mesh(extrudeShape(aShape, 0.7), M.bridge));
  for (const [x, z, r, n] of [[-3.2, -6.2, 2.2, 40], [1.6, -8.4, 1.6, 30], [4.4, -3.8, 1.3, 26]]) { auto.add(at(gearMesh(r, n, 0.2, M.goldWheel, 0), x, 0.72, z)); auto.add(at(jewelMesh(M, 0.32), x, 0.95, z)); }
  at(auto, 0, 3.15, 0); mv.add(auto); parts.auto = auto;
  // rotor
  const rotor = tag(new THREE.Group(), 'rotor');
  const rs = new THREE.Shape(); rs.absarc(0, 0, 12.4, Math.PI, Math.PI * 2, false); rs.absarc(0, 0, 2.2, Math.PI * 2, Math.PI, true); rs.closePath();
  rotor.add(new THREE.Mesh(extrudeShape(rs, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25, map: TX.rotorTexture(12.4, watch.rotorText) })));
  const heavy = new THREE.Mesh(extrudeShape(ringShape(10.8, 12.6, Math.PI, Math.PI * 2), 0.9), M.metal(watch.case.metal)); heavy.position.y = -0.2; rotor.add(heavy);
  rotor.add(at(cyl(2.3, 0.8, M.steel, 32), 0, -0.2, 0));
  rotor.add(hitProxy(M, 12.4, 1.2, 0.3)); rotor.rotation.y = 0.35; at(rotor, 0, 4.25, 0); mv.add(rotor); parts.rotor = rotor;
  // bridas de caja (2) — fijan el movimiento al aro de la caja
  const clamps = tag(new THREE.Group(), 'clamps');
  for (const [x, z] of [[-7.2, 10.0], [10.4, -6.0]]) { const d = new THREE.Vector3(x, 0, z).normalize(); const tab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 4.0), M.darkSteel); tab.position.set(x + d.x * 1.3, 1.4, z + d.z * 1.3); tab.rotation.y = Math.atan2(-d.z, d.x) + Math.PI / 2; clamps.add(tab); clamps.add(at(boxHit(M, 3.2, 1.2, 4.6), tab.position.x, 1.5, tab.position.z)); }
  mv.add(clamps); parts.clamps = clamps;
  parts.stem = stemGroup(M, R, M.metal(watch.case.metal), 0.7); mv.add(parts.stem);

  // ── lado esfera ──
  const ds = new THREE.Group(); ds.name = 'dialSide'; ds.rotation.z = Math.PI; mv.add(ds);
  const ys = { dial: 1.4, hour: 1.95, min: 2.2, sec: 2.45 };
  const dp = tag(new THREE.Group(), 'datePlate'); dp.add(at(new THREE.Mesh(extrudeShape(ringShape(6.2, 11.4), 0.25, 0.03, 48), M.steel), 0, 0.95, 0)); dp.add(hitProxy(M, 11.4, 0.5, 1.07)); ds.add(dp); parts.datePlate = dp;
  const dd = tag(new THREE.Group(), 'dateDisc'); const ring = new THREE.Mesh(new THREE.RingGeometry(9.8, 12.6, 96).rotateX(-Math.PI / 2), M.whiteDisc); ring.position.y = 0.9; dd.add(ring); dd.add(hitProxy(M, 12.6, 0.3, 0.85)); dd.rotation.y = 0.2; ds.add(dd); parts.dateDisc = dd;
  { const uv = ring.geometry.attributes.uv, pos = ring.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 25.2 + 0.5, -pos.getZ(i) / 25.2 + 0.5); }
  const hw = tag(new THREE.Group(), 'hourWheel'); hw.add(at(gearMesh(3.0, 40, 0.15, M.goldWheel, 0), 0, 0.55, 0)); hw.add(at(cyl(0.75, 1.35, M.goldWheel, 16), 0, 0.55, 0)); hw.add(hitProxy(M, 3.1, 0.5, 0.65)); ds.add(hw); parts.hourWheel = hw;
  const cp = tag(new THREE.Group(), 'cannonPinion'); cp.add(cyl(0.5, 1.95, M.steel, 12, 0.2)); cp.add(at(gearMesh(1.1, 14, 0.25, M.steel, 0), 0, 0.2, 0)); cp.add(hitProxy(M, 1.2, 0.6, 0.3)); ds.add(cp); parts.cannonPinion = cp;
  const mw = tag(new THREE.Group(), 'minuteWheel'); mw.add(gearMesh(2.2, 32, 0.15, M.goldWheel, 0)); mw.add(at(gearMesh(0.7, 10, 0.25, M.steel, 0), 0, 0.15, 0)); mw.add(hitProxy(M, 2.3, 0.5, 0.2)); at(mw, -3.6, 0.2, 3.0); ds.add(mw); parts.minuteWheel = mw;
  const ddr = tag(new THREE.Group(), 'dateDriver'); ddr.add(gearMesh(2.4, 36, 0.15, M.goldWheel, 3)); ddr.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 1.4), M.steel), 0, 0.15, -2.6)); ddr.add(hitProxy(M, 2.6, 0.5, 0.15)); at(ddr, 3.4, 0.45, 4.4); ds.add(ddr); parts.dateDriver = ddr;
  const kp = tag(new THREE.Group(), 'keylessPlate'); kp.add(at(new THREE.Mesh(extrudeShape(polyShape([[5.5, -4], [11.8, -3.4], [12.2, 1.5], [9.5, 4.6], [6.2, 1.2]]), 0.2, 0.03), M.steel), 0, 0.5, 0)); kp.add(at(boxHit(M, 6, 0.5, 8), 9, 0.6, 0.2)); ds.add(kp); parts.keylessPlate = kp;
  const yk = tag(new THREE.Group(), 'yoke'); yk.add(at(new THREE.Mesh(extrudeShape(polyShape([[7.5, 0.8], [10.8, 1.8], [10.2, 3.2], [7.0, 2.0]]), 0.2, 0.02), M.steel), 0, 0.25, 0)); yk.add(at(boxHit(M, 4, 0.5, 2.6), 8.9, 0.35, 2)); ds.add(yk); parts.yoke = yk;
  const sl = tag(new THREE.Group(), 'settingLever'); sl.add(at(new THREE.Mesh(extrudeShape(polyShape([[6, -2.5], [10.5, -1.6], [10.2, -0.6], [6.4, -1.4]]), 0.2, 0.02), M.steel), 0, 0.25, 0)); sl.add(at(boxHit(M, 4.8, 0.5, 2), 8.3, 0.35, -1.5)); ds.add(sl); parts.settingLever = sl;
  const stl = tag(new THREE.Group(), 'stopLever'); stl.add(at(new THREE.Mesh(extrudeShape(polyShape([[3, -6.4], [8.2, -4.6], [8.0, -4.0], [3.2, -5.6]]), 0.15, 0.01), M.darkSteel), 0, 0.05, 0)); stl.add(at(boxHit(M, 5.6, 0.5, 2.2), 5.6, 0.15, -5.2)); ds.add(stl); parts.stopLever = stl;
  const sp = tag(new THREE.Group(), 'slidingPinion'); sp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.6, 12).rotateZ(Math.PI / 2), M.steel), 9.6, 0.1, 0)); sp.add(at(boxHit(M, 2, 1, 1.4), 9.6, 0.1, 0)); ds.add(sp); parts.slidingPinion = sp;
  const wp = tag(new THREE.Group(), 'windingPinion'); wp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.0, 14).rotateZ(Math.PI / 2), M.steel), 11.4, 0.1, 0)); wp.add(at(boxHit(M, 1.4, 1.2, 1.8), 11.4, 0.1, 0)); ds.add(wp); parts.windingPinion = wp;
  parts.dial = buildDial(M, images, watch, ys); ds.add(parts.dial);
  const H = buildHands(M, watch, ys); ds.add(H.hour, H.min, H.sec); parts.hourHand = H.hour; parts.minHand = H.min; parts.secHand = H.sec;
  if (H.gmt && parts.dial.userData.recta) parts.dial.userData.recta.gmt = H.gmt;
  const protector = makeProtector(M, watch, ys); ds.add(protector);
  const screws = screwsFor(M, cal, parts);
  shadowAll(mv);
  return { mv, parts, sub, screws, dialSide: ds, protector, R, ys, wheel, kind: 'auto' };
}

// ───────────────────────── ZQ-11 (cuarzo fino) ─────────────────────────
export function buildZQ11(M, images, watch, cal) {
  const R = 11.65;
  const mv = tag(new THREE.Group(), 'movement'); const parts = {}; const sub = {};
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.9, 96), [M.darkSteel, M.plateBrass, M.plateBrass]); plate.position.y = 0.45; mv.add(plate);
  const pcbArea = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.3, R - 0.3, 0.05, 64, 1, false, 0, Math.PI * 2), M.plateBrass); pcbArea.position.y = 0.92; mv.add(pcbArea);
  // rodaje (bajo el puente)
  const wheel = (id, x, y, z, r, n, mat = M.goldWheel) => { const w = tag(new THREE.Group(), id); w.add(gearMesh(r, n, 0.14, mat, r > 1.6 ? 4 : 0)); w.add(at(cyl(0.18, 0.9, M.steel, 8), 0, -0.3, 0)); w.add(hitProxy(M, r + 0.3, 0.5, 0.2)); at(w, x, y, z); mv.add(w); parts[id] = w; return w; };
  wheel('centerWheel', 0, 0.95, 0, 2.8, 48); wheel('secondWheel', 0, 1.25, 0, 1.6, 30); wheel('thirdWheel', -3.2, 1.0, -4.8, 2.0, 36); wheel('fifthWheel', -6.2, 1.25, -2.6, 1.4, 24);
  const sr = tag(new THREE.Group(), 'stepRotor'); const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 20), M.magnet); mag.position.y = 0.25; sr.add(mag); sr.add(at(gearMesh(0.45, 6, 0.2, M.steel, 0), 0, 0.5, 0)); sr.add(hitProxy(M, 1.2, 0.8, 0.3)); at(sr, -6.5, 1.0, -6.0); mv.add(sr); parts.stepRotor = sr; sub.stepRotorMag = sr;
  const tb = tag(new THREE.Group(), 'trainBridge');
  tb.add(new THREE.Mesh(extrudeShape(polyShape([[-9.6, -1.2], [-8.8, 1.6], [-3, 2.4], [2.4, 1.0], [2.4, -6.5], [2.4, -9.2], [-2, -10.4], [-7.5, -8.6], [-9.4, -5]]), 0.6, 0.05), M.bridgeGilt));
  for (const [x, z] of [[0, 0], [-3.2, -4.8], [-6.2, -2.6], [-6.5, -6.0]]) tb.add(at(jewelMesh(M, 0.32), x, 0.6, z));
  at(tb, 0, 1.6, 0); mv.add(tb); parts.trainBridge = tb;
  // bobina + estátor
  const coil = tag(new THREE.Group(), 'coil');
  const stator = new THREE.Mesh(extrudeShape((() => { const s = polyShape([[-8.4, -7.8], [3.0, -7.6], [3.2, -4.6], [-8.2, -4.4]]); const h = new THREE.Path(); h.absarc(-6.5, -6.0, 1.05, 0, Math.PI * 2, true); s.holes.push(h); return s; })(), 0.25, 0.02), M.steel); coil.add(stator);
  const coilMat = M.copper.clone(); const wind = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 5.6, 20).rotateZ(Math.PI / 2), coilMat); wind.position.set(5.8, 0.85, -6.0); coil.add(wind);
  for (let k = 0; k < 18; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.03, 4, 16).rotateY(Math.PI / 2), coilMat); r.position.set(3.2 + k * 0.3, 0.85, -6.0); coil.add(r); }
  const core = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.25, 1.0), M.steel); core.position.set(5.6, 0.12, -6.0); coil.add(core);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), M.steel); tab.position.set(8.6, 0.85, -6.3); coil.add(tab);
  coil.add(at(boxHit(M, 7, 1.8, 2.6), 5.8, 0.8, -6.0)); at(coil, 0, 0.9, 0); mv.add(coil); parts.coil = coil; sub.coilWind = wind; sub.coilMat = coilMat;
  // circuito con el diapasón de cuarzo
  const circ = tag(new THREE.Group(), 'circuit');
  circ.add(new THREE.Mesh(extrudeShape(polyShape([[3, -3], [10.6, -3.2], [11.1, 2], [9.5, 6.5], [5, 8.6], [2.6, 5]]), 0.3, 0.02), M.pcb));
  const ic = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 24), M.epoxy); ic.position.set(5.6, 0.5, 1.0); circ.add(ic);
  const xtal = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 16).rotateZ(Math.PI / 2), M.steel); xtal.position.set(6.4, 0.9, 5.0); circ.add(xtal);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 0.9), M.goldChaton); strip.position.set(0.4, 0.3, 5.0); circ.add(strip);
  for (const [x, z] of [[9, -2.2], [10, 1], [4, -2]]) circ.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 10), M.goldChaton), x, 0.32, z));
  circ.add(at(boxHit(M, 8, 1.4, 11), 6.8, 0.6, 2.6)); at(circ, 0, 1.4, 0); mv.add(circ); parts.circuit = circ;
  // pila + brida
  const bat = tag(new THREE.Group(), 'battery'); const cell = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.1, 40), [M.batterySide, M.battery, M.batterySide]); cell.position.y = 1.05; bat.add(cell); bat.add(hitProxy(M, 3.5, 2.4, 1.05)); at(bat, -5.5, 0.2, 5.0); mv.add(bat); parts.battery = bat; sub.batteryCell = cell;
  const bc = tag(new THREE.Group(), 'batteryClamp');
  const strap = new THREE.Mesh(extrudeShape(polyShape([[-6.5, 2.6], [-4.4, 2.6], [-8.0, 7.0], [-9.8, 6.6]]), 0.2, 0.02), M.steel); strap.position.y = 2.3; bc.add(strap);
  const post = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), M.steel); post.position.set(-8.9, 1.7, 6.1); bc.add(post);
  bc.add(at(boxHit(M, 4, 0.8, 5), -7, 2.4, 4.8)); mv.add(bc); parts.batteryClamp = bc;
  parts.stem = stemGroup(M, R, M.metal(watch.case.metal), 0.45, 2.0, 2.6); mv.add(parts.stem);
  // ── lado esfera ──
  const ds = new THREE.Group(); ds.name = 'dialSide'; ds.rotation.z = Math.PI; mv.add(ds);
  const ys = { dial: 1.0, hour: 1.25, min: 1.45, sec: 1.65 };
  const hw = tag(new THREE.Group(), 'hourWheel'); hw.add(at(gearMesh(2.6, 36, 0.15, M.goldWheel, 0), 0, 0.35, 0)); hw.add(at(cyl(0.7, 0.85, M.goldWheel, 16), 0, 0.35, 0)); hw.add(at(cyl(0.45, 1.55, M.steel, 12), 0, 0.0, 0)); hw.add(hitProxy(M, 2.7, 0.5, 0.45)); ds.add(hw); parts.hourWheel = hw;
  const mw = tag(new THREE.Group(), 'minuteWheel'); mw.add(gearMesh(1.9, 28, 0.14, M.goldWheel, 0)); mw.add(at(gearMesh(0.6, 9, 0.2, M.steel, 0), 0, 0.14, 0)); mw.add(hitProxy(M, 2.0, 0.5, 0.2)); at(mw, -3.0, 0.15, 2.4); ds.add(mw); parts.minuteWheel = mw;
  const kp = tag(new THREE.Group(), 'keylessPlate'); kp.add(at(new THREE.Mesh(extrudeShape(polyShape([[5, -3.2], [10.8, -2.6], [11.0, 1.8], [8.6, 4.4], [5.6, 1.2]]), 0.17, 0.02), M.steel), 0, 0.25, 0)); kp.add(at(boxHit(M, 6, 0.5, 7.6), 8.2, 0.35, 0.6)); ds.add(kp); parts.keylessPlate = kp;
  const yk = tag(new THREE.Group(), 'yoke'); yk.add(at(new THREE.Mesh(extrudeShape(polyShape([[6.8, 0.6], [9.8, 1.5], [9.3, 2.8], [6.4, 1.8]]), 0.15, 0.01), M.steel), 0, 0.05, 0)); yk.add(at(boxHit(M, 3.8, 0.4, 2.6), 8.1, 0.12, 1.7)); ds.add(yk); parts.yoke = yk;
  const sl = tag(new THREE.Group(), 'settingLever'); sl.add(at(new THREE.Mesh(extrudeShape(polyShape([[5.6, -2.2], [9.6, -1.4], [9.4, -0.5], [5.9, -1.2]]), 0.15, 0.01), M.steel), 0, 0.05, 0)); sl.add(at(boxHit(M, 4.4, 0.4, 2), 7.6, 0.12, -1.3)); ds.add(sl); parts.settingLever = sl;
  parts.dial = buildDial(M, images, watch, ys); ds.add(parts.dial);
  const H = buildHands(M, watch, ys); ds.add(H.hour, H.min, H.sec); parts.hourHand = H.hour; parts.minHand = H.min; parts.secHand = H.sec;
  const protector = makeProtector(M, watch, ys); ds.add(protector);
  const screws = screwsFor(M, cal, parts);
  shadowAll(mv);
  return { mv, parts, sub, screws, dialSide: ds, protector, R, ys, kind: 'quartz' };
}
