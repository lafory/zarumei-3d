// Reloj ZARUMEI procedural (unidades: mm). Convención: 12h = −Z, 3h = +X, esfera mira a +Y.
// Movimiento ZR-28: arquitectura tipo ETA 2824-2 / Sellita SW200-1 (Ø 25,6 mm, 4 Hz).
import * as THREE from 'three';
import * as TX from './textures.js';

export const MOV_R = 12.8;

export function makeMaterials(images) {
  const cotes = TX.cotesTexture(); cotes.repeat.set(0.28, 0.28);
  const perl = TX.perlageTexture(); perl.repeat.set(7, 7);
  return {
    gold: new THREE.MeshStandardMaterial({ color: 0xf0c25a, metalness: 1, roughness: 0.2 }),
    goldBrushed: new THREE.MeshStandardMaterial({ color: 0xe8b850, metalness: 1, roughness: 0.42 }),
    goldWheel: new THREE.MeshStandardMaterial({ color: 0xe2b35a, metalness: 1, roughness: 0.3 }),
    bezelTop: new THREE.MeshStandardMaterial({ color: 0xf0c25a, metalness: 1, roughness: 0.25, map: TX.bezelTexture() }),
    caseback: new THREE.MeshStandardMaterial({ color: 0xf0c25a, metalness: 1, roughness: 0.28, map: (() => { const t = TX.casebackTexture(); t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; return t; })() }), // la tapa inferior del cilindro invierte la UV
    dial: new THREE.MeshStandardMaterial({ map: TX.dialTexture(images.dial, new Date().getDate()), roughness: 0.55, metalness: 0 }),
    lume: new THREE.MeshStandardMaterial({ color: 0xf2ffe6, roughness: 0.5, emissive: 0x334433, emissiveIntensity: 0.4 }),
    bridge: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.32, map: cotes }),
    plate: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.4, map: perl }),
    steel: new THREE.MeshStandardMaterial({ color: 0xd4d9df, metalness: 1, roughness: 0.22 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 1, roughness: 0.35 }),
    blueScrew: new THREE.MeshStandardMaterial({ color: 0x2d55c8, metalness: 0.8, roughness: 0.28 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xd01836, roughness: 0.08, metalness: 0, clearcoat: 1, transmission: 0, sheen: 0.2 }),
    spacer: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.8 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.12, depthWrite: false, clearcoat: 1 }),
    dirtyOil: new THREE.MeshStandardMaterial({ color: 0x3b2a10, roughness: 0.9, transparent: true, opacity: 0.88 }),
    cleanOil: new THREE.MeshPhysicalMaterial({ color: 0xfff6c8, roughness: 0.02, transparent: true, opacity: 0.45, clearcoat: 1 }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  };
}

// ── helpers de geometría ──
function extrudeShape(shape, depth, bevel = 0.06) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 48 });
  g.rotateX(Math.PI / 2); // forma (x,y) → plano XZ; cara frontal mira a +Y en y=0, extruye hacia −Y
  g.translate(0, depth, 0); // ocupa [0, depth]
  return g;
}
function polyShape(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; }
export function gearShape(r, teeth, hole = 0.4, spokes = 0) {
  const s = new THREE.Shape(), h = Math.min(0.5, r * 0.12);
  for (let i = 0; i < teeth; i++) {
    const a0 = i / teeth * Math.PI * 2, a1 = (i + 0.25) / teeth * Math.PI * 2, a2 = (i + 0.5) / teeth * Math.PI * 2, a3 = (i + 0.75) / teeth * Math.PI * 2;
    const pt = (rr, a) => [Math.cos(a) * rr, Math.sin(a) * rr];
    const p0 = pt(r, a0), p1 = pt(r + h, a1), p2 = pt(r + h, a2), p3 = pt(r, a3);
    if (i === 0) s.moveTo(...p0); else s.lineTo(...p0);
    s.lineTo(...p1); s.lineTo(...p2); s.lineTo(...p3);
  }
  s.closePath();
  if (hole) { const hp = new THREE.Path(); hp.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(hp); }
  if (spokes && r > 1.6) {
    for (let k = 0; k < spokes; k++) {
      const a = k / spokes * Math.PI * 2, w = Math.PI * 2 / spokes * 0.62, r0 = r * 0.3, r1 = r * 0.78;
      const hp = new THREE.Path(); hp.absarc(0, 0, r1, a + 0.12, a + w, false); hp.absarc(0, 0, r0, a + w - 0.05, a + 0.2, true); hp.closePath();
      s.holes.push(hp);
    }
  }
  return s;
}
function gearMesh(r, teeth, depth, mat, spokes = 4) { return new THREE.Mesh(extrudeShape(gearShape(r, teeth, 0.35, spokes), depth, 0.02), mat); }
function screwMesh(M, r = 0.55) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 20), M.blueScrew); head.position.y = 0.175; g.add(head);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, 0.12, r * 0.25), M.darkSteel); slot.position.y = 0.34; slot.rotation.y = Math.random() * 3; g.add(slot);
  return g;
}
function jewelMesh(M, r = 0.45) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 20), M.ruby); m.position.y = 0.06; return m; }
function hitProxy(M, r, h, y = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), M.hit); m.position.y = y; m.userData.isHit = true; return m; }
function tag(obj, partId) { obj.userData.partId = partId; obj.name = partId; return obj; }
function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
function shadowAll(o) { o.traverse(m => { if (m.isMesh && !m.userData.isHit && m.material && !m.material.transparent) { m.castShadow = true; m.receiveShadow = true; } }); }

// ───────────────── MOVIMIENTO (coordenadas locales: lado puentes mira a +Y) ─────────────────
// Vista desde el lado puentes: +X derecha, −Z arriba. La tija sale por −X (las 3h al voltear).
export function buildMovement(M) {
  const mv = tag(new THREE.Group(), 'movement');
  const parts = {};
  // Platina (100)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(MOV_R, MOV_R, 1.2, 96), [M.darkSteel, M.plate, M.darkSteel]);
  plate.position.y = 0.6; mv.add(plate);
  for (const [x, z] of [[2, 2], [-3, 4], [6, -1]]) mv.add(at(jewelMesh(M, 0.35), x, 1.2, z));

  // Tren de ruedas (bajo el puente de rodaje)
  const wheels = [
    ['secondWheel', 0, 0, 3.4, 60], ['thirdWheel', 5.4, -3.8, 2.8, 50],
    ['escapeWheel', 6.9, 1.6, 2.0, 20], ['interWheel', 2.6, -7.0, 2.4, 44]
  ];
  for (const [id, x, z, r, n] of wheels) {
    const w = tag(new THREE.Group(), id);
    const gm = gearMesh(r, n, 0.18, M.goldWheel, id === 'escapeWheel' ? 0 : 4); w.add(gm);
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12), M.steel); arbor.position.y = 0.5; w.add(arbor);
    w.add(hitProxy(M, r + 0.3, 0.6, 0.3));
    at(w, x, 1.35, z); mv.add(w); parts[id] = w;
    w.userData.spin = id === 'escapeWheel' ? 1.5 : id === 'secondWheel' ? 0.1 : 0.4;
  }
  // Barrilete (180/1)
  const barrel = tag(new THREE.Group(), 'barrel');
  barrel.add(new THREE.Mesh(extrudeShape(gearShape(5.0, 80, 0.6, 0), 0.7, 0.03), M.goldWheel));
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.7, 0.72, 48), M.steel); drum.position.y = 0.36; barrel.add(drum);
  barrel.add(hitProxy(M, 5.2, 0.8, 0.4));
  at(barrel, -4.6, 1.25, -5.0); mv.add(barrel); parts.barrel = barrel;

  // Puente de barrilete (105)
  const bbShape = new THREE.Shape();
  bbShape.moveTo(-12.4, -2.0); bbShape.absarc(0, 0, 12.4, Math.PI + 0.16, Math.PI * 1.5 - 0.02, false);
  bbShape.lineTo(1.2, -11.6); bbShape.quadraticCurveTo(1.6, -4.2, -1.0, -1.4); bbShape.quadraticCurveTo(-6, 1.4, -12.4, -2.0);
  const bb = tag(new THREE.Group(), 'barrelBridge');
  bb.add(new THREE.Mesh(extrudeShape(bbShape, 0.8), M.bridge));
  for (const [x, z] of [[-10.5, -3.6], [-2.2, -10.8], [-0.4, -3.2]]) bb.add(at(screwMesh(M, 0.6), x, 0.8, z));
  bb.add(at(jewelMesh(M, 0.4), -4.6, 0.8, -5.0));
  at(bb, 0, 2.0, 0); mv.add(bb); parts.barrelBridge = bb;
  // Rochet (415) + tornillo 5415
  const ratchet = tag(new THREE.Group(), 'ratchet');
  ratchet.add(new THREE.Mesh(extrudeShape(gearShape(3.5, 46, 0, 0), 0.35, 0.02), M.steel));
  ratchet.add(at(screwMesh(M, 0.9), 0, 0.35, 0)); ratchet.add(hitProxy(M, 3.7, 0.6, 0.3));
  at(ratchet, -4.6, 2.85, -5.0); mv.add(ratchet); parts.ratchet = ratchet;
  // Rueda de corona (420)
  const cw = tag(new THREE.Group(), 'crownWheel');
  cw.add(new THREE.Mesh(extrudeShape(gearShape(1.7, 22, 0, 0), 0.3, 0.02), M.steel)); cw.add(at(screwMesh(M, 0.55), 0, 0.3, 0)); cw.add(hitProxy(M, 2.0, 0.6, 0.3));
  at(cw, -9.6, 2.85, -1.6); mv.add(cw); parts.crownWheel = cw;
  // Cliquet (425) + resorte
  const click = tag(new THREE.Group(), 'click');
  click.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.6, 0.5], [2.4, 1.6], [0.6, 1.4], [-0.3, 0.8]]), 0.3, 0.02), M.steel));
  click.add(hitProxy(M, 1.8, 0.6, 0.3));
  at(click, -1.6, 2.85, -9.4); mv.add(click); parts.click = click;

  // Puente de rodaje (110)
  const tbShape = new THREE.Shape();
  tbShape.moveTo(1.6, -11.6); tbShape.absarc(0, 0, 12.4, Math.PI * 1.5 + 0.13, Math.PI * 2 + 0.25, false);
  tbShape.lineTo(9.8, 4.4); tbShape.quadraticCurveTo(3.6, 3.4, 0.6, 1.4); tbShape.quadraticCurveTo(2.2, -4.6, 1.6, -11.6);
  const tb = tag(new THREE.Group(), 'trainBridge');
  tb.add(new THREE.Mesh(extrudeShape(tbShape, 0.8), M.bridge));
  for (const [x, z] of [[5.4, -3.8], [6.9, 1.6], [2.6, -7.0]]) tb.add(at(jewelMesh(M, 0.38), x, 0.8, z));
  for (const [x, z] of [[9.2, -6.2], [4.2, -10.4]]) tb.add(at(screwMesh(M, 0.6), x, 0.8, z));
  at(tb, 0, 2.0, 0); mv.add(tb); parts.trainBridge = tb;

  // Áncora (710) y su puente (125)
  const pf = tag(new THREE.Group(), 'palletFork');
  pf.add(new THREE.Mesh(extrudeShape(polyShape([[-0.3, -2.2], [0.3, -2.2], [0.25, 0.4], [1.3, 0.9], [1.1, 1.3], [0, 0.8], [-1.1, 1.3], [-1.3, 0.9], [-0.25, 0.4]]), 0.15, 0.01), M.steel));
  pf.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.5), M.ruby), 1.2, 0.1, 1.05));
  pf.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.5), M.ruby), -1.2, 0.1, 1.05));
  pf.add(hitProxy(M, 1.6, 0.5, 0.2));
  pf.rotation.y = -0.6; at(pf, 4.6, 1.4, 4.4); mv.add(pf); parts.palletFork = pf;
  const pb = tag(new THREE.Group(), 'palletBridge');
  pb.add(new THREE.Mesh(extrudeShape(polyShape([[1.6, 3.0], [6.4, 2.8], [7.0, 4.5], [2.4, 5.2]]), 0.7), M.bridge));
  pb.add(at(jewelMesh(M, 0.32), 4.4, 0.7, 4.0)); pb.add(at(screwMesh(M, 0.5), 6.2, 0.7, 3.4)); pb.add(at(screwMesh(M, 0.5), 2.6, 0.7, 4.4));
  at(pb, 0, 2.0, 0); mv.add(pb); parts.palletBridge = pb;

  // Volante (721) + espiral + puente de volante (121/3) con amortiguador (3024)
  const BX = 4.6, BZ = 8.6;
  const balance = tag(new THREE.Group(), 'balance');
  const wheel = new THREE.Group(); wheel.name = 'balanceWheel';
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.3, 12, 64).rotateX(Math.PI / 2), M.goldWheel));
  for (let k = 0; k < 3; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 0.4), M.goldWheel); arm.position.x = 1.55; const p = new THREE.Group(); p.add(arm); p.rotation.y = k * Math.PI * 2 / 3; wheel.add(p); }
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 10), M.steel); staff.position.y = 0.6; wheel.add(staff);
  // espiral (Arquímedes) como tubo fino
  const pts = []; for (let t = 0; t < 12 * Math.PI; t += 0.12) { const r = 0.5 + t * 0.062; pts.push(new THREE.Vector3(Math.cos(t) * r, 0.45, Math.sin(t) * r)); }
  const spiral = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.035, 5, false), new THREE.MeshStandardMaterial({ color: 0x4b6c9c, metalness: 1, roughness: 0.3 }));
  wheel.add(spiral);
  wheel.position.y = -0.35; balance.add(wheel);
  const cockShape = new THREE.Shape();
  cockShape.moveTo(-1.8, -0.6); cockShape.quadraticCurveTo(0, -2.0, 1.8, -0.6);
  cockShape.lineTo(5.2, -3.8); cockShape.lineTo(6.0, -2.0); cockShape.lineTo(2.0, 1.4); cockShape.quadraticCurveTo(0, 2.2, -1.8, 0.6); cockShape.closePath();
  const cock = new THREE.Mesh(extrudeShape(cockShape, 0.6), M.bridge); cock.position.y = 0.6; balance.add(cock);
  // amortiguador superior: engaste + rubí + piedra de tope + resorte lira
  const setting = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.3, 32), M.steel); setting.position.y = 1.35; balance.add(setting);
  const jewel = tag(new THREE.Group(), 'jewel');
  jewel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 32), M.ruby));
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.05, 24), M.dirtyOil); dirt.position.y = 0.1; dirt.name = 'dirtyOil'; jewel.add(dirt);
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24), M.cleanOil); oil.position.y = 0.1; oil.visible = false; oil.name = 'cleanOil'; jewel.add(oil);
  jewel.add(hitProxy(M, 0.85, 0.4, 0.1));
  jewel.position.y = 1.56; balance.add(jewel);
  const lyrePts = [[-1.2, 0.0], [-0.9, -0.95], [0, -1.25], [0.9, -0.95], [1.2, 0]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const spring = tag(new THREE.Group(), 'spring');
  const lyre = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lyrePts), 40, 0.09, 6), M.steel); spring.add(lyre);
  const lyre2 = lyre.clone(); lyre2.rotation.y = Math.PI; spring.add(lyre2);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.9), M.steel); hinge.position.x = -1.25; spring.add(hinge);
  spring.add(at(hitProxy(M, 0.5, 0.4), -1.3, 0, 0));
  spring.position.y = 1.62; balance.add(spring);
  // raqueta y porta-pitón
  const reg = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.35), M.steel); reg.position.set(1.6, 1.25, -0.4); reg.rotation.y = 0.4; balance.add(reg);
  balance.add(hitProxy(M, 3.5, 1.4, 0.4));
  at(balance, BX, 2.0, BZ); mv.add(balance); parts.balance = balance; parts.jewel = jewel; parts.spring = spring;
  // tornillo del puente de volante (5121)
  const bs = tag(new THREE.Group(), 'balscrew'); bs.add(screwMesh(M, 0.7)); bs.add(hitProxy(M, 1.3, 0.8, 0.3));
  at(bs, BX + 5.2, 3.2, BZ - 2.7); mv.add(bs); parts.balscrew = bs;

  // Módulo automático (1134) con ruedas de inversión/reducción
  const auto = tag(new THREE.Group(), 'auto');
  const aShape = new THREE.Shape();
  aShape.moveTo(-10.6, -4.5); aShape.quadraticCurveTo(-6, -12, 2, -11.9); aShape.quadraticCurveTo(9.8, -10.8, 10.6, -4);
  aShape.quadraticCurveTo(9.6, 1.4, 3.4, 2.2); aShape.quadraticCurveTo(-4.5, 3.0, -10.6, -4.5);
  auto.add(new THREE.Mesh(extrudeShape(aShape, 0.7), M.bridge));
  for (const [x, z, r, n] of [[-3.2, -6.2, 2.2, 40], [1.6, -8.4, 1.6, 30], [4.4, -3.8, 1.3, 26]]) {
    auto.add(at(gearMesh(r, n, 0.2, M.goldWheel, 0), x, 0.72, z)); auto.add(at(jewelMesh(M, 0.32), x, 0.95, z));
  }
  auto.add(at(screwMesh(M, 0.6), -7.4, 0.7, -4.6)); auto.add(at(screwMesh(M, 0.6), 7.0, 0.7, -8.4));
  at(auto, 0, 3.15, 0); mv.add(auto); parts.auto = auto;

  // Rotor (1143/1) con rodamiento de bolas (1497) y tornillo (51497)
  const rotor = tag(new THREE.Group(), 'rotor');
  const rs = new THREE.Shape(); rs.absarc(0, 0, 12.4, Math.PI, Math.PI * 2, false); rs.absarc(0, 0, 2.2, Math.PI * 2, Math.PI, true); rs.closePath();
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25, map: TX.rotorTexture(12.4) });
  rotor.add(new THREE.Mesh(extrudeShape(rs, 0.5), rotorMat));
  const heavy = new THREE.Mesh(extrudeShape((() => { const s = new THREE.Shape(); s.absarc(0, 0, 12.6, Math.PI, Math.PI * 2, false); s.absarc(0, 0, 10.8, Math.PI * 2, Math.PI, true); s.closePath(); return s; })(), 0.9), M.gold);
  heavy.position.y = -0.2; rotor.add(heavy);
  const bearing = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.8, 32), M.steel); bearing.position.y = 0.2; rotor.add(bearing);
  rotor.add(at(screwMesh(M, 1.0), 0, 0.6, 0));
  rotor.add(hitProxy(M, 12.4, 1.2, 0.3));
  rotor.rotation.y = 0.35; at(rotor, 0, 4.25, 0); mv.add(rotor); parts.rotor = rotor;

  // Tija (401) + corona + empujador de tirette (443/1)
  const stem = tag(new THREE.Group(), 'stem');
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 9.6, 12).rotateZ(Math.PI / 2), M.steel); rod.position.set(-MOV_R - 3.6, 0, 0); stem.add(rod);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 3.6, 28).rotateZ(Math.PI / 2), M.gold); crown.position.set(-MOV_R - 9.2, 0, 0); stem.add(crown);
  for (let k = 0; k < 14; k++) { const fl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.25), M.goldBrushed); const a = k / 14 * Math.PI * 2; fl.position.set(-MOV_R - 9.2, Math.cos(a) * 3.12, Math.sin(a) * 3.12); stem.add(fl); }
  const crownCap = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 28).rotateZ(Math.PI / 2), M.goldBrushed); crownCap.position.set(-MOV_R - 11.05, 0, 0); stem.add(crownCap);
  const push = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 16), M.steel); push.position.set(-9.8, 1.5, 2.6); stem.add(push);
  stem.add(at(hitProxy(M, 1.6, 1.0), -9.8, 1.5, 2.6));
  stem.add(at(hitProxy(M, 3.4, 4), -MOV_R - 9.2, 0, 0));
  at(stem, 0, 0.7, 0); mv.add(stem); parts.stem = stem;

  shadowAll(mv);
  return { mv, parts, wheel, dirt, oil, spring };
}

// ───────────────── RELOJ COMPLETO ─────────────────
export function buildWatch(M) {
  const root = tag(new THREE.Group(), 'watch');
  const body = new THREE.Group(); root.add(body);
  const parts = {};
  // Caja (perfil torneado)
  const prof = [[16.3, -4.6], [18.6, -4.6], [19.6, -3.6], [20.0, -1.5], [20.0, 1.2], [19.4, 2.2], [16.3, 2.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const caseM = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), M.gold); caseM.material.side = THREE.DoubleSide; body.add(caseM);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(16.3, 16.3, 6.8, 96, 1, true), M.goldBrushed); inner.material = M.goldBrushed.clone(); inner.material.side = THREE.BackSide; inner.position.y = -1.2; body.add(inner);
  // aro espaciador
  const spacer = new THREE.Mesh(new THREE.LatheGeometry([[MOV_R + 0.1, -3.4], [16.2, -3.4], [16.2, 1.0], [MOV_R + 0.1, 1.0]].map(([r, y]) => new THREE.Vector2(r, y)), 96), M.spacer);
  spacer.material.side = THREE.DoubleSide; body.add(spacer); parts.spacer = spacer;
  // asas
  for (const s of [-1, 1]) for (const xx of [-8.6, 8.6]) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 10), M.gold); lug.position.set(xx, -0.8, s * 21.5); body.add(lug);
  }
  // brazalete de 3 eslabones (central pulido)
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = s * (27.5 + i * 5.6);
    const side1 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.0, 5.2), M.goldBrushed); side1.position.set(-7.2, -1.6, z); body.add(side1);
    const side2 = side1.clone(); side2.position.x = 7.2; body.add(side2);
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7.6, 20).rotateZ(Math.PI / 2), M.gold); mid.position.set(0, -1.3, z); mid.scale.set(1, 1, 1.6); body.add(mid);
  }
  // hombros de protección de corona (rasgo propio)
  for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.4, 2.6), M.gold); sh.position.set(20.6, -0.8, s * 4.4); body.add(sh); }
  // bisel giratorio con graduación grabada
  const bezelBody = new THREE.Mesh(new THREE.LatheGeometry([[16.0, 2.2], [19.6, 2.2], [19.9, 2.8], [19.4, 3.6], [16.0, 3.7]].map(([r, y]) => new THREE.Vector2(r, y)), 128), M.gold);
  bezelBody.material.side = THREE.DoubleSide; body.add(bezelBody);
  const bezelTop = new THREE.Mesh(new THREE.RingGeometry(16.1, 19.3, 128, 1).rotateX(-Math.PI / 2), M.bezelTop); bezelTop.position.y = 3.72; body.add(bezelTop);
  // la UV de RingGeometry es plana (x,y)/2R → escalar para que cubra el canvas
  { const uv = bezelTop.geometry.attributes.uv, pos = bezelTop.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { uv.setXY(i, pos.getX(i) / (2 * 19.3) + 0.5, -pos.getZ(i) / (2 * 19.3) + 0.5); } uv.needsUpdate = true; }
  for (let k = 0; k < 120; k++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.5), M.goldBrushed); const a = k / 120 * Math.PI * 2; n.position.set(Math.cos(a) * 19.85, 2.9, Math.sin(a) * 19.85); n.rotation.y = -a; body.add(n); }
  // esfera
  const dial = new THREE.Mesh(new THREE.CircleGeometry(16.2, 128).rotateX(-Math.PI / 2), M.dial); dial.position.y = 1.4; body.add(dial);
  // índices aplicados en oro (12 arriba = −Z)
  for (let h = 1; h <= 12; h++) {
    if (h === 3) continue;
    const a = h * Math.PI / 6, r = 13.2, x = Math.sin(a) * r, z = -Math.cos(a) * r;
    if (h === 12) { for (const dx of [-0.75, 0.75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 3.0), M.gold); b.position.set(dx, 1.62, -13.0); body.add(b); } continue; }
    if (h % 3 === 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 3.0), M.gold); b.position.set(x, 1.62, z); b.rotation.y = -a; body.add(b); }
    else { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.45, 24), M.gold); d.position.set(x, 1.62, z); body.add(d); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.48, 20), M.lume); l.position.set(x, 1.64, z); body.add(l); }
  }
  // agujas tipo espada (no "Mercedes")
  function sword(len, w) { const s = new THREE.Shape(); s.moveTo(-w * 0.55, -2); s.lineTo(-w / 2, len * 0.8); s.lineTo(0, len); s.lineTo(w / 2, len * 0.8); s.lineTo(w * 0.55, -2); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g; }
  const hands = {};
  const mkHand = (len, w, y) => { const g = new THREE.Group(); const m = new THREE.Mesh(sword(len, w), M.gold); g.add(m); const l = new THREE.Mesh(sword(len * 0.82, w * 0.45), M.lume); l.position.y = 0.05; g.add(l); g.position.y = y; body.add(g); return g; };
  hands.h = mkHand(8.6, 1.5, 1.95); hands.m = mkHand(12.8, 1.1, 2.2);
  hands.s = new THREE.Group(); { const n = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 17).translate(0, 0, -5.5), M.gold); hands.s.add(n); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 20), M.lume); c.position.z = -10.5; hands.s.add(c); const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20), M.gold); cw.position.z = 2.6; hands.s.add(cw); }
  hands.s.position.y = 2.45; body.add(hands.s);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 20), M.gold); pin.position.y = 2.2; body.add(pin);
  // cristal de zafiro
  const crystal = new THREE.Mesh(new THREE.CylinderGeometry(16.1, 16.1, 0.8, 96), M.crystal); crystal.position.y = 3.3; crystal.renderOrder = 5; body.add(crystal);

  // Movimiento dentro de la caja (girado: lado puentes hacia el fondo)
  const MV = buildMovement(M);
  const mvMount = new THREE.Group(); mvMount.position.y = 1.25; mvMount.rotation.z = Math.PI; root.add(mvMount);
  mvMount.add(MV.mv);
  Object.assign(parts, MV.parts); parts.movement = MV.mv;
  // Fondo roscado
  const cb = tag(new THREE.Group(), 'caseback');
  const cbMesh = new THREE.Mesh(new THREE.CylinderGeometry(17.6, 18.2, 1.1, 96), [M.gold, M.gold, M.caseback]); cb.add(cbMesh);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const n = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.2), M.darkSteel); n.position.set(Math.cos(a) * 17.2, -0.35, Math.sin(a) * 17.2); n.rotation.y = -a; cb.add(n); }
  cb.add(hitProxy(M, 18.2, 1.4));
  cb.position.y = -5.15; root.add(cb); parts.caseback = cb;

  shadowAll(root);
  return { root, body, parts, hands, balanceWheel: MV.wheel, dirt: MV.dirt, oil: MV.oil, spring: MV.spring, mvMount };
}
