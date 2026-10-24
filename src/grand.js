// Calibre ZC — gran complicación mecánica ZARUMEI.
// Base real: rodaje, escape, volante con amortiguador, barrilete, automático, cronógrafo de rueda de columnas,
// calendario de día y mes, y profundímetro de membrana. Módulos: brújula, hora militar de 24 h, fases de luna.
// Coordenadas: lado puentes +Y, tija −X. dialSide girado 180° en Z (esfera +Y, 12 h = −Z, 3 h = +X).
import * as THREE from 'three';
import * as TX from './textures.js';
import { extrudeShape, polyShape, gearShape, gearMesh, ringShape, hitProxy, boxHit, tag, at, cyl, jewelMesh, shadowAll } from './geom.js';
import { screwsFor, stemGroup, makeProtector } from './movement.js';
import { buildDial, buildHands } from './dialside.js';

const RED = new THREE.MeshPhysicalMaterial({ color: 0x9a1424, metalness: 0.28, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 });
const BLACK = new THREE.MeshPhysicalMaterial({ color: 0x101010, metalness: 0.82, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
const WING = new THREE.MeshPhysicalMaterial({ color: 0xe31b8d, metalness: 0.15, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
const BLUEJ = new THREE.MeshPhysicalMaterial({ color: 0x1a3cff, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1 });

function subHand(M, id, len, mat, y) {
  const g = tag(new THREE.Group(), id);
  const inner = new THREE.Group(); inner.name = 'rot'; g.add(inner);
  inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, len).translate(0, 0, -len * 0.32), mat));
  inner.add(at(cyl(0.28, 0.08, mat, 12), 0, 0, 0));
  const hp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, len), M.hit); hp.userData.isHit = true; hp.position.z = -len * 0.25; inner.add(hp);
  g.position.y = y; return g;
}

function devil(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const face = new THREE.Mesh(new THREE.SphereGeometry(3.15, 28, 20), RED); face.scale.set(1, 0.42, 1.18); g.add(face);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.1, 10), RED);
    h.position.set(s * 1.35, 0.85, -2.15); h.rotation.z = s * -0.45; h.rotation.x = -0.7; g.add(h);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.35 }));
    eye.position.set(s * 1.05, 0.55, -2.55); g.add(eye);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 14), BLACK); orb.position.set(s * 3.5, 0.15, 1.7); g.add(orb);
  }
  for (let i = -3; i <= 3; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.38), new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.45 }));
    t.position.set(i * 0.28, 0.42, 2.55); g.add(t);
  }
  g.add(hitProxy(M, 3.6, 1.3, 0.3));
  return g;
}
function espina(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x6d5cff, metalness: 1, roughness: 0.14, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [80, 420], envMapIntensity: 1.05 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 16), skin); core.scale.y = 0.55; g.add(core);
  const gold = M.metal('gold');
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.7, 8), gold);
    c.position.set(Math.cos(a) * 2.3, 0.55, Math.sin(a) * 2.3);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0.85, Math.sin(a)).normalize());
    g.add(c);
  }
  g.add(hitProxy(M, 3.2, 1.2, 0.35));
  return g;
}
function ala(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const gold = M.metal('gold');
  const wing = (s) => {
    const w = new THREE.Mesh(extrudeShape(polyShape([[s * 0.35, -0.15], [s * 6.2, -2.9], [s * 7.15, -1.15], [s * 4.4, 0.55], [s * 0.7, 0.85]]), 0.28, 0.02), gold);
    g.add(w);
  };
  wing(1); wing(-1);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 14), WING); body.scale.set(0.7, 0.4, 1.35); g.add(body);
  for (const [x, z] of [[0.55, -0.8], [-0.55, -0.8], [0.45, 0.7], [-0.45, 0.7]]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), BLUEJ), x, 0.55, z));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 8), gold); beak.position.set(0, 0.35, 2.3); beak.rotation.x = Math.PI / 2; g.add(beak);
  g.add(hitProxy(M, 4.2, 1.0, 0.3));
  return g;
}
function orbital(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const steel = M.metal('steel');
  const gold = M.metal('gold');
  for (const [rx, ry, r] of [[0.9, 0.2, 3.3], [0.4, 1.1, 2.7], [1.3, 0.6, 2.15]]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 8, 48), steel);
    t.rotation.x = rx; t.rotation.y = ry; g.add(t);
  }
  g.add(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.1, 8, 32), gold));
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0x0d6b45, metalness: 0.1, roughness: 0.2, clearcoat: 1 }));
  gem.scale.y = 0.45; g.add(gem);
  g.add(hitProxy(M, 3.6, 1.1, 0.3));
  return g;
}

function sello(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const gold = M.metal('gold');
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.28, 48), gold);
  disc.position.y = 0.31;
  g.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.12, 8, 48).rotateX(Math.PI / 2), gold);
  ring.position.y = 0.48; g.add(ring);
  for (const z of [-0.85, 0.85]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.26), gold), 0, 0.52, z));
  const diag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 2.15), gold);
  diag.position.set(0, 0.52, 0); diag.rotation.y = 0.62; g.add(diag);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), BLUEJ);
  cab.scale.y = 0.5; cab.position.set(0, 0.64, 0.05); g.add(cab);
  g.add(hitProxy(M, 3.3, 0.7, 0.35));
  return g;
}

function placa(M) {
  const g = tag(new THREE.Group(), 'emblem');
  const gold = M.metal('gold');
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.28, 40), gold);
  disc.position.y = 0.31;
  g.add(disc);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 1.2), gold);
  bar.position.y = 0.48; g.add(bar);
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.2), gold), 0, 0.48, -0.5));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.2), gold), 0, 0.48, 0.5));
  g.add(hitProxy(M, 1.8, 0.55, 0.2));
  return g;
}

function makeBalance(M, x, z) {
  const balance = tag(new THREE.Group(), 'balance');
  const wheel = new THREE.Group(); wheel.name = 'balanceWheel';
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.26, 10, 40).rotateX(Math.PI / 2), M.goldWheel));
  for (let k = 0; k < 3; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.32), M.goldWheel); arm.position.x = 1.3; const p = new THREE.Group(); p.add(arm); p.rotation.y = k * Math.PI * 2 / 3; wheel.add(p); }
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.7, 10), M.steel); staff.position.y = 0.45; wheel.add(staff);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 8), M.steel); pivot.position.y = 1.45; pivot.name = 'pivot'; wheel.add(pivot);
  const pts = []; for (let t = 0; t < 10 * Math.PI; t += 0.15) { const r = 0.45 + t * 0.055; pts.push(new THREE.Vector3(Math.cos(t) * r, 0.4, Math.sin(t) * r)); }
  wheel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.03, 4), M.blueSpring));
  wheel.position.y = -0.3; balance.add(wheel);
  const cock = new THREE.Mesh(extrudeShape(polyShape([[-1.5, -0.4], [1.6, -0.5], [4.4, -2.6], [5.0, -1.4], [1.6, 1.2], [-1.5, 0.6]]), 0.5, 0.02), M.bridge); cock.position.y = 0.5; balance.add(cock);
  const jewel = tag(new THREE.Group(), 'jewel');
  jewel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 24), M.ruby));
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.04, 20), M.dirtyOil.clone()); dirt.position.y = 0.1; dirt.visible = false; jewel.add(dirt);
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 20), M.cleanOil); oil.position.y = 0.1; oil.visible = false; jewel.add(oil);
  jewel.add(hitProxy(M, 0.75, 0.35, 0.08)); jewel.position.y = 1.35; balance.add(jewel);
  const spring = tag(new THREE.Group(), 'spring');
  const lyre = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-1.05, 0, 0], [-0.7, 0, -0.8], [0, 0, -1.05], [0.7, 0, -0.8], [1.05, 0, 0]].map(p => new THREE.Vector3(...p))), 24, 0.08, 6), M.steel);
  spring.add(lyre); const lyre2 = lyre.clone(); lyre2.rotation.y = Math.PI; spring.add(lyre2);
  spring.add(at(hitProxy(M, 0.45, 0.35), -1.1, 0, 0)); spring.position.y = 1.42; balance.add(spring);
  const regulator = tag(new THREE.Group(), 'regulator');
  regulator.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.28).translate(1.3, 0, 0), M.steel));
  regulator.add(at(boxHit(M, 1.6, 0.5, 1.0), 2.2, 0, 0)); regulator.position.set(0, 1.1, -0.15); regulator.rotation.y = 0.4; balance.add(regulator);
  balance.add(hitProxy(M, 3.1, 1.4, 0.35)); at(balance, x, 2.05, z);
  return { balance, wheel, sub: { jewel, spring, regulator, dirt, oil, pivot, wheel, staff } };
}

export function buildGrand(M, images, watch, cal) {
  const opt = watch.grand, R = 13.1;
  const mv = tag(new THREE.Group(), 'movement'); const parts = {}; const sub = {};
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.15, 80), [M.darkSteel, M.plateBrass, M.plateBrass]); plate.position.y = 0.58; mv.add(plate);
  const wheel = (id, x, y, z, r, n) => {
    const w = tag(new THREE.Group(), id);
    w.add(gearMesh(r, n, 0.16, M.goldWheel, id === 'escapeWheel' ? 0 : 4));
    w.add(at(cyl(0.2, 1.0, M.steel, 8), 0, -0.25, 0));
    w.add(hitProxy(M, r + 0.25, 0.5, 0.15));
    at(w, x, y, z); mv.add(w); parts[id] = w; return w;
  };
  wheel('secondWheel', 1.2, 1.3, 6.4, 2.2, 40);
  wheel('thirdWheel', 6.2, 1.3, -2.4, 2.5, 44);
  wheel('escapeWheel', 7.4, 1.35, 2.2, 1.7, 20);
  wheel('interWheel', 3.4, 1.28, -6.6, 2.1, 36);
  wheel('chronoRunner', 0, 1.45, 0.2, 2.4, 48);
  wheel('chronoMinute', 5.6, 1.42, 5.0, 1.9, 30);
  wheel('chronoHour', -5.4, 1.42, 4.6, 1.8, 28);

  const barrel = tag(new THREE.Group(), 'barrel');
  barrel.add(new THREE.Mesh(extrudeShape(gearShape(4.6, 64, 0.5, 0), 0.62, 0.02, 12), M.goldWheel));
  const drumMat = M.steel.clone(); const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 0.66, 40), drumMat); drum.position.y = 0.32; barrel.add(drum);
  const spr = []; for (let t = 0; t < 12 * Math.PI; t += 0.22) { const r = 0.9 + t * 0.08; spr.push(new THREE.Vector3(Math.cos(t) * r, 0.7, Math.sin(t) * r)); }
  const mainspring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spr), 200, 0.05, 4), new THREE.MeshStandardMaterial({ color: 0x5b4a3a, metalness: 0.7, roughness: 0.6 }));
  mainspring.visible = false; barrel.add(mainspring);
  barrel.add(hitProxy(M, 4.8, 0.7, 0.3)); at(barrel, -4.8, 1.2, -5.2); mv.add(barrel); parts.barrel = barrel;
  sub.barrelDrum = drum; sub.mainspring = mainspring;

  const bb = tag(new THREE.Group(), 'barrelBridge');
  bb.add(new THREE.Mesh(extrudeShape(polyShape([[-12.2, -1.2], [-8, -10.6], [-1.2, -11.2], [0.4, -4], [-2, -1.2], [-6, 0.4]]), 0.7, 0.03), M.bridge));
  bb.add(at(jewelMesh(M, 0.36), -4.8, 0.7, -5.2)); at(bb, 0, 1.95, 0); mv.add(bb); parts.barrelBridge = bb;
  const ratchet = tag(new THREE.Group(), 'ratchet'); ratchet.add(gearMesh(3.1, 40, 0.28, M.steel, 0)); ratchet.add(hitProxy(M, 3.3, 0.5, 0.15)); at(ratchet, -4.8, 2.75, -5.2); mv.add(ratchet); parts.ratchet = ratchet;
  const cw = tag(new THREE.Group(), 'crownWheel'); cw.add(gearMesh(1.55, 20, 0.24, M.steel, 0)); cw.add(hitProxy(M, 1.8, 0.45, 0.12)); at(cw, -8.8, 2.75, -2.2); mv.add(cw); parts.crownWheel = cw;
  const click = tag(new THREE.Group(), 'click');
  click.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.5, 0.4], [2.2, 1.4], [0.5, 1.2]]), 0.26, 0.02), M.steel));
  click.add(hitProxy(M, 1.5, 0.45, 0.15)); at(click, -2.2, 2.75, -8.8); mv.add(click); parts.click = click;

  const tb = tag(new THREE.Group(), 'trainBridge');
  tb.add(new THREE.Mesh(extrudeShape(polyShape([[2.2, -8.4], [8.6, -5.2], [9.4, 3.6], [5.2, 4.4], [4.6, -1.2], [2.6, -2.4]]), 0.7, 0.03), M.bridge));
  tb.add(at(jewelMesh(M, 0.32), 6.2, 0.7, -2.4)); tb.add(at(jewelMesh(M, 0.3), 7.4, 0.7, 2.2));
  at(tb, 0, 1.95, 0); mv.add(tb); parts.trainBridge = tb;

  const pf = tag(new THREE.Group(), 'palletFork');
  pf.add(new THREE.Mesh(extrudeShape(polyShape([[-0.25, -1.8], [0.25, -1.8], [0.2, 0.3], [1.05, 0.75], [0.9, 1.1], [0, 0.65], [-0.9, 1.1], [-1.05, 0.75], [-0.2, 0.3]]), 0.14, 0.01), M.steel));
  pf.add(hitProxy(M, 1.3, 0.4, 0.1)); pf.rotation.y = -0.5; at(pf, 5.2, 1.4, 3.6); mv.add(pf); parts.palletFork = pf;
  const pb = tag(new THREE.Group(), 'palletBridge');
  pb.add(new THREE.Mesh(extrudeShape(polyShape([[3.6, 2.4], [7.2, 2.2], [7.6, 4.2], [3.8, 4.6]]), 0.55, 0.02), M.bridge));
  pb.add(at(jewelMesh(M, 0.28), 5.2, 0.55, 3.4)); at(pb, 0, 1.95, 0); mv.add(pb); parts.palletBridge = pb;

  const bal = makeBalance(M, 5.4, 8.2); mv.add(bal.balance); parts.balance = bal.balance; Object.assign(sub, bal.sub);

  const cb = tag(new THREE.Group(), 'chronoBridge');
  cb.add(new THREE.Mesh(extrudeShape(polyShape([[-7.2, 2.2], [-2, 6.6], [7.2, 6.4], [7.4, 3.2], [2.2, 1.6], [2.4, -1.6], [-2.2, -1.4], [-6.6, 1.2]]), 0.55, 0.03), M.bridgeGilt));
  cb.add(at(jewelMesh(M, 0.3), 0, 0.55, 0.2)); cb.add(at(jewelMesh(M, 0.28), 5.6, 0.55, 5)); cb.add(at(jewelMesh(M, 0.28), -5.4, 0.55, 4.6));
  const col = tag(new THREE.Group(), 'columnWheel');
  col.add(gearMesh(1.35, 12, 0.2, M.steel, 0));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; col.add(at(cyl(0.18, 0.45, M.steel, 8), Math.cos(a) * 0.7, 0.25, Math.sin(a) * 0.7)); }
  col.add(hitProxy(M, 1.5, 0.7, 0.2)); at(col, -2.4, 2.15, 3.2); mv.add(col); parts.columnWheel = col;
  at(cb, 0, 2.45, 0); mv.add(cb); parts.chronoBridge = cb;
  const coupling = tag(new THREE.Group(), 'coupling');
  coupling.add(new THREE.Mesh(extrudeShape(polyShape([[-1, 0], [2.4, 0.3], [2.6, 0.9], [-0.8, 0.7]]), 0.18, 0.01), M.steel));
  coupling.add(hitProxy(M, 1.6, 0.4, 0.1)); at(coupling, 2.2, 2.15, -1.2); mv.add(coupling); parts.coupling = coupling;
  const brake = tag(new THREE.Group(), 'brake');
  brake.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [2.2, 0.5], [2.0, 0.9], [0.1, 0.45]]), 0.14, 0.01), M.darkSteel));
  brake.add(hitProxy(M, 1.3, 0.35, 0.08)); at(brake, -3.2, 2.15, -0.6); mv.add(brake); parts.brake = brake;

  const auto = tag(new THREE.Group(), 'auto');
  auto.add(new THREE.Mesh(extrudeShape(polyShape([[-11, -3], [-4, -11.4], [6, -10], [10.5, -2], [6, 1.6], [-6, 1.2]]), 0.55, 0.03), M.bridge));
  auto.add(at(gearMesh(1.5, 24, 0.16, M.goldWheel, 0), -2.4, 0.6, -7.2));
  at(auto, 0, 3.2, 0); mv.add(auto); parts.auto = auto;
  const rotor = tag(new THREE.Group(), 'rotor');
  const rs = new THREE.Shape(); rs.absarc(0, 0, 12.2, Math.PI, Math.PI * 2, false); rs.absarc(0, 0, 2.1, Math.PI * 2, Math.PI, true); rs.closePath();
  rotor.add(new THREE.Mesh(extrudeShape(rs, 0.45), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25, map: TX.rotorTexture(12.2, watch.rotorText) })));
  rotor.add(hitProxy(M, 12.2, 1.0, 0.25)); at(rotor, 0, 4.15, 0); mv.add(rotor); parts.rotor = rotor;

  const clamps = tag(new THREE.Group(), 'clamps');
  for (const [x, z] of [[-7.4, 9.4], [9.6, -5.2]]) {
    const d = new THREE.Vector3(x, 0, z).normalize();
    const tab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 3.6), M.darkSteel);
    tab.position.set(x + d.x * 1.1, 1.25, z + d.z * 1.1); tab.rotation.y = Math.atan2(-d.z, d.x) + Math.PI / 2; clamps.add(tab);
  }
  mv.add(clamps); parts.clamps = clamps;
  parts.stem = stemGroup(M, R, M.metal(watch.case.crown || watch.case.metal), 0.65); mv.add(parts.stem);

  const ds = new THREE.Group(); ds.name = 'dialSide'; ds.rotation.z = Math.PI; mv.add(ds);
  const ys = { dial: 1.42, hour: 2.05, min: 2.32, sec: 2.58 };
  const metal = M.metal(watch.hands.metal);
  const depthAt = opt.rim ? [0, 13.2] : opt.moon ? [5.6, 5.2] : [0, 7.7];
  const depthHand = subHand(M, 'depthHand', 3.2, metal, ys.sec + 0.06); depthHand.position.x = depthAt[0]; depthHand.position.z = depthAt[1]; ds.add(depthHand); parts.depthHand = depthHand;

  const emblem = (opt.emblem === 'espina' ? espina : opt.emblem === 'ala' ? ala : opt.emblem === 'orbital' ? orbital : opt.emblem === 'sello' ? sello : opt.emblem === 'placa' ? placa : devil)(M);
  emblem.position.y = ys.dial + 0.28;
  if (opt.rim) emblem.position.z = -14.3;
  ds.add(emblem); parts.emblem = emblem;

  if (opt.military) {
    const mil = subHand(M, 'milHand', watch.dial.r * 0.62, metal, ys.hour + 0.12); ds.add(mil); parts.milHand = mil;
    const h24 = tag(new THREE.Group(), 'hour24');
    h24.add(new THREE.Mesh(extrudeShape(ringShape(4.2, 5.4), 0.12, 0), M.goldWheel));
    h24.add(hitProxy(M, 5.4, 0.3, 0.1)); h24.position.y = 0.55; ds.add(h24); parts.hour24 = h24;
  }
  if (opt.compass) {
    const bowl = tag(new THREE.Group(), 'compassBowl');
    bowl.add(new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.25, 0.35, 28), M.metal('gold')));
    bowl.add(new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.6 })));
    bowl.add(hitProxy(M, 2.3, 0.5, 0.15)); bowl.position.set(0, ys.dial + 0.2, -8.4); ds.add(bowl); parts.compassBowl = bowl;
    const needle = tag(new THREE.Group(), 'compassNeedle');
    const inner = new THREE.Group(); inner.name = 'rot'; needle.add(inner);
    inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 2.6).translate(0, 0.15, -0.3), new THREE.MeshStandardMaterial({ color: 0xc41212, metalness: 0.4, roughness: 0.35 })));
    inner.add(hitProxy(M, 0.5, 0.4, 0.15)); needle.position.set(0, ys.dial + 0.35, -8.4); ds.add(needle); parts.compassNeedle = needle;
    const cap = tag(new THREE.Group(), 'compassCap');
    cap.add(new THREE.Mesh(new THREE.SphereGeometry(2.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.crystal));
    cap.add(hitProxy(M, 2.1, 0.6, 0.2)); cap.position.set(0, ys.dial + 0.45, -8.4); ds.add(cap); parts.compassCap = cap;
  }
  if (opt.moon) {
    const moon = tag(new THREE.Group(), 'moonDisc');
    moon.add(new THREE.Mesh(new THREE.CircleGeometry(2.5, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.moonDiscTexture(), roughness: 0.45 })));
    moon.add(hitProxy(M, 2.5, 0.3, 0.05)); moon.position.set(0, 0.5, 7.6); ds.add(moon); parts.moonDisc = moon;
    const mw = tag(new THREE.Group(), 'moonWheel'); mw.add(gearMesh(1.1, 16, 0.14, M.goldWheel, 0)); mw.add(hitProxy(M, 1.2, 0.3, 0.08)); at(mw, 2.6, 0.35, 6.4); ds.add(mw); parts.moonWheel = mw;
  }

  const dayAt = opt.rim ? [-12.6, -1.4] : opt.compass ? [-6.6, -3.4] : [0, -9.1];
  const monAt = opt.rim ? [12.6, -1.4] : opt.compass ? [6.6, -3.4] : [0, -6.5];
  const calPlate = tag(new THREE.Group(), 'calendarPlate');
  calPlate.add(new THREE.Mesh(extrudeShape(ringShape(7.2, 12.2), 0.16, 0, 40), M.steel));
  calPlate.add(hitProxy(M, 12, 0.3, 0.1)); calPlate.position.y = 0.85; ds.add(calPlate); parts.calendarPlate = calPlate;
  const day = tag(new THREE.Group(), 'dayDisc');
  day.add(new THREE.Mesh(new THREE.CircleGeometry(2.05, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.calendarDiscTexture(['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']), roughness: 0.55 })));
  day.add(hitProxy(M, 2.05, 0.25, 0.05)); day.position.set(dayAt[0], 0.55, dayAt[1]); ds.add(day); parts.dayDisc = day;
  const month = tag(new THREE.Group(), 'monthDisc');
  month.add(new THREE.Mesh(new THREE.CircleGeometry(2.15, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.calendarDiscTexture(['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'], '#f7f1e4'), roughness: 0.55 })));
  month.add(hitProxy(M, 2.15, 0.25, 0.05)); month.position.set(monAt[0], 0.48, monAt[1]); ds.add(month); parts.monthDisc = month;
  const jumper = tag(new THREE.Group(), 'dayJumper');
  jumper.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.6, 0.3], [1.5, 0.7], [0, 0.4]]), 0.12, 0), M.steel));
  jumper.add(hitProxy(M, 1.0, 0.3, 0.06)); jumper.position.set(dayAt[0] + 2.2, 0.6, dayAt[1]); ds.add(jumper); parts.dayJumper = jumper;

  const membrane = tag(new THREE.Group(), 'membrane');
  membrane.add(new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.9 })));
  membrane.add(hitProxy(M, 1.8, 0.35, 0.08)); membrane.position.set(depthAt[0], 0.35, depthAt[1]); ds.add(membrane); parts.membrane = membrane;
  const rack = tag(new THREE.Group(), 'depthRack');
  rack.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.35), M.steel));
  rack.add(hitProxy(M, 1.3, 0.3, 0.08)); rack.position.set(depthAt[0] + 2.2, 0.42, depthAt[1]); ds.add(rack); parts.depthRack = rack;
  const pin = tag(new THREE.Group(), 'depthPinion');
  pin.add(gearMesh(0.7, 10, 0.16, M.steel, 0)); pin.add(hitProxy(M, 0.85, 0.3, 0.08));
  pin.position.set(depthAt[0] + 1.2, 0.48, depthAt[1] - 1.4); ds.add(pin); parts.depthPinion = pin;

  const hw = tag(new THREE.Group(), 'hourWheel'); hw.add(gearMesh(2.6, 36, 0.14, M.goldWheel, 0)); hw.add(hitProxy(M, 2.7, 0.35, 0.1)); hw.position.y = 0.4; ds.add(hw); parts.hourWheel = hw;
  const cp = tag(new THREE.Group(), 'cannonPinion'); cp.add(cyl(0.42, 1.5, M.steel, 12)); cp.add(hitProxy(M, 0.7, 0.5, 0.3)); ds.add(cp); parts.cannonPinion = cp;
  const mw = tag(new THREE.Group(), 'minuteWheel'); mw.add(gearMesh(1.8, 28, 0.14, M.goldWheel, 0)); mw.add(hitProxy(M, 1.9, 0.3, 0.1)); at(mw, -3.2, 0.25, 2.6); ds.add(mw); parts.minuteWheel = mw;
  const kp = tag(new THREE.Group(), 'keylessPlate');
  kp.add(new THREE.Mesh(extrudeShape(polyShape([[5.2, -3.4], [11.2, -2.6], [11.4, 1.4], [7.2, 3.2], [5.4, 0.6]]), 0.16, 0.02), M.steel));
  kp.add(hitProxy(M, 3, 0.4, 0.2)); kp.position.y = 0.2; ds.add(kp); parts.keylessPlate = kp;
  const yk = tag(new THREE.Group(), 'yoke'); yk.add(new THREE.Mesh(extrudeShape(polyShape([[7.2, 0.6], [10.2, 1.4], [9.6, 2.4], [6.8, 1.5]]), 0.14, 0.01), M.steel)); yk.add(hitProxy(M, 1.6, 0.3, 0.1)); yk.position.y = 0.1; ds.add(yk); parts.yoke = yk;
  const sl = tag(new THREE.Group(), 'settingLever'); sl.add(new THREE.Mesh(extrudeShape(polyShape([[5.8, -2.2], [10, -1.3], [9.6, -0.5], [5.8, -1.2]]), 0.14, 0.01), M.steel)); sl.add(hitProxy(M, 2, 0.3, 0.1)); sl.position.y = 0.1; ds.add(sl); parts.settingLever = sl;
  const spn = tag(new THREE.Group(), 'slidingPinion'); spn.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 10).rotateZ(Math.PI / 2), M.steel), 9.2, 0.15, 0)); spn.add(at(boxHit(M, 1.6, 0.8, 1.2), 9.2, 0.15, 0)); ds.add(spn); parts.slidingPinion = spn;
  const wp = tag(new THREE.Group(), 'windingPinion'); wp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.9, 12).rotateZ(Math.PI / 2), M.steel), 11, 0.15, 0)); wp.add(at(boxHit(M, 1.2, 1, 1.4), 11, 0.15, 0)); ds.add(wp); parts.windingPinion = wp;

  parts.dial = buildDial(M, images, watch, ys); ds.add(parts.dial);
  const H = buildHands(M, watch, ys); ds.add(H.hour, H.min, H.sec); parts.hourHand = H.hour; parts.minHand = H.min; parts.secHand = H.sec;
  const protector = makeProtector(M, watch, ys); ds.add(protector);
  const screws = screwsFor(M, cal, parts);
  for (const p of cal.parts) if (p.id !== 'caseback' && p.id !== 'movement' && !parts[p.id]) throw new Error('ZC sin malla: ' + p.id);
  shadowAll(mv);
  return { mv, parts, sub, screws, dialSide: ds, protector, R, ys, wheel: bal.wheel, kind: 'auto' };
}
