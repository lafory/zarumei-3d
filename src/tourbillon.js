// Calibre ZT-18 — turbillón volante de cuerda manual (Astral Miami / Astral Cuba).
// El motor ZR-28 y el cuarzo ZQ-11 no pasan por aquí.
import * as THREE from 'three';
import * as TX from './textures.js';
import { extrudeShape, polyShape, gearMesh, hitProxy, boxHit, tag, at, cyl, jewelMesh, shadowAll } from './geom.js';
import { screwsFor, stemGroup, makeProtector } from './movement.js';

const diamondMat = () => new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.4, ior: 2.4,
  clearcoat: 1, clearcoatRoughness: 0.02, attenuationColor: new THREE.Color(0xeef6ff), attenuationDistance: 4
});

function brilliant(r) {
  const g = new THREE.Group(), m = diamondMat();
  const crown = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.62, 16), m); crown.position.y = r * 0.28; g.add(crown);
  const pav = new THREE.Mesh(new THREE.ConeGeometry(r * 0.98, r * 0.95, 16), m); pav.rotation.z = Math.PI; pav.position.y = -r * 0.32; g.add(pav);
  return g;
}
function stoneRing(metal, r, y) {
  const g = new THREE.Group(), m = diamondMat();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 8, 48).rotateX(Math.PI / 2), metal));
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), m);
    s.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(s);
  }
  return g;
}
function bearFace(images, which, r) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(S / 2, S / 2 - 8, S / 2, 0, Math.PI * 2); x.clip();
  const img = which === 'cuba' ? images.cubaBear : images.dial;
  const k = Math.max(S / img.width, S / img.height) * (which === 'cuba' ? 1.05 : 1.15);
  const w = img.width * k, h = img.height * k;
  x.drawImage(img, (S - w) / 2, (S - h) / 2 + (which === 'cuba' ? 8 : 18), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.42, metalness: 0.04 }));
  mesh.position.y = 0.2;
  return mesh;
}
function tinyHand(M, id, len, w, y) {
  const g = tag(new THREE.Group(), id);
  const inner = new THREE.Group(); inner.name = 'rot'; g.add(inner);
  const s = new THREE.Shape();
  s.moveTo(0, -0.28); s.quadraticCurveTo(-w, len * 0.45, 0, len); s.quadraticCurveTo(w, len * 0.45, 0, -0.28); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  inner.add(new THREE.Mesh(geo, M.metal('gold')));
  inner.add(at(cyl(0.16, 0.08, M.goldChaton, 12), 0, 0, 0));
  const hp = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.9, w + 0.35), 0.35, len + 0.4), M.hit);
  hp.userData.isHit = true; hp.position.set(0, 0.05, -len * 0.35); inner.add(hp);
  g.position.y = y; return g;
}
function arm(M, x, z) {
  const len = Math.hypot(x, z);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, len), M.metal('gold'));
  bar.position.set(x / 2, 0.42, z / 2); bar.rotation.y = Math.atan2(x, z);
  const jewels = [];
  for (let t = 0.35; t < 0.95; t += 0.22) jewels.push(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), diamondMat()), x * t, 0.66, z * t));
  return [bar, ...jewels];
}

export function buildZT18(M, images, watch, cal) {
  const R = 13.2, L = watch.astral.layout, gold = M.metal('gold'), goldB = M.metal('gold', true);
  const mv = tag(new THREE.Group(), 'movement'); const parts = {}; const sub = {};
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.05, 96), [M.darkSteel, M.plateBrass, M.plateBrass]);
  plate.position.y = 0.52; mv.add(plate);
  for (const [x, z] of [[4.2, 3.1], [-3.4, 4.4], [1.2, -5.2], [-6.2, -2.2]]) mv.add(at(jewelMesh(M, 0.32), x, 1.08, z));

  // ── lado puentes: barrilete, escape de base, cuerda manual ──
  const wheel = (id, x, y, z, r, n) => {
    const w = tag(new THREE.Group(), id);
    w.add(gearMesh(r, n, 0.16, M.goldWheel, r > 1.8 ? 5 : 0));
    w.add(at(cyl(0.18, 0.8, M.steel, 8), 0, -0.25, 0));
    w.add(hitProxy(M, r + 0.25, 0.45, 0.2));
    at(w, x, y, z); return w;
  };
  // ruedas del rodaje van al lado esfera (se ven por el cristal); aquí solo el tren de cuerda
  const barrel = tag(new THREE.Group(), 'barrel');
  barrel.add(new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 1.5, 40), goldB));
  barrel.add(at(gearMesh(4.6, 64, 0.22, M.goldWheel, 0), 0, 0.15, 0));
  const spr = []; for (let t = 0; t < 12 * Math.PI; t += 0.25) { const rr = 0.8 + t * 0.09; spr.push(new THREE.Vector3(Math.cos(t) * rr, 0.4, Math.sin(t) * rr)); }
  const mainspring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spr), 180, 0.05, 4), new THREE.MeshStandardMaterial({ color: 0x6a5438, metalness: 0.7, roughness: 0.55 }));
  mainspring.visible = false; barrel.add(mainspring);
  barrel.add(hitProxy(M, 4.8, 1.6, 0.7)); at(barrel, -3.2, 1.15, -4.4); mv.add(barrel); parts.barrel = barrel; sub.mainspring = mainspring;
  const bb = tag(new THREE.Group(), 'barrelBridge');
  bb.add(new THREE.Mesh(extrudeShape(polyShape([[-8.2, -1.2], [-7.4, -8.6], [1.4, -8.8], [1.6, -1.4], [-2.2, 0.4]]), 0.7), M.bridgeGilt));
  bb.add(at(jewelMesh(M, 0.36), -3.2, 0.72, -4.4));
  bb.add(hitProxy(M, 4.2, 0.5, 0.4)); at(bb, 0, 2.15, 0); mv.add(bb); parts.barrelBridge = bb;
  const ratchet = tag(new THREE.Group(), 'ratchet');
  ratchet.add(gearMesh(2.5, 36, 0.28, M.steel, 0)); ratchet.add(hitProxy(M, 2.7, 0.5, 0.2));
  at(ratchet, -3.2, 2.95, -4.4); mv.add(ratchet); parts.ratchet = ratchet;
  const cw = tag(new THREE.Group(), 'crownWheel');
  cw.add(gearMesh(1.55, 22, 0.26, M.steel, 0)); cw.add(hitProxy(M, 1.8, 0.45, 0.2));
  at(cw, -6.6, 2.9, -1.8); mv.add(cw); parts.crownWheel = cw;
  const click = tag(new THREE.Group(), 'click');
  click.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.8, 0.35], [2.2, 1.15], [0.4, 1.05]]), 0.28, 0.02), M.steel));
  click.add(hitProxy(M, 1.4, 0.45, 0.2)); at(click, -1.1, 2.9, -7.6); mv.add(click); parts.click = click;
  const pb = tag(new THREE.Group(), 'palletBridge');
  pb.add(new THREE.Mesh(extrudeShape(polyShape([[2.2, 5.2], [7.4, 4.6], [7.8, 7.2], [2.4, 7.4]]), 0.55), M.bridgeGilt));
  pb.add(at(jewelMesh(M, 0.28), 5.0, 0.55, 6.2)); at(pb, 0, 2.05, 0); mv.add(pb); parts.palletBridge = pb;
  const pf = tag(new THREE.Group(), 'palletFork');
  pf.add(new THREE.Mesh(extrudeShape(polyShape([[-0.25, -1.6], [0.25, -1.6], [0.2, 0.2], [1.05, 0.7], [0.9, 1.05], [0, 0.55], [-0.9, 1.05], [-1.05, 0.7], [-0.2, 0.2]]), 0.14, 0.01), M.steel));
  for (const sx of [0.95, -0.95]) pf.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.4), M.ruby), sx, 0.1, 0.85));
  pf.add(hitProxy(M, 1.3, 0.4, 0.15)); at(pf, 5.0, 1.35, 6.0); mv.add(pf); parts.palletFork = pf;

  const clamps = tag(new THREE.Group(), 'clamps');
  for (const [x, z] of [[-8.4, 8.2], [9.2, -5.4]]) {
    const d = new THREE.Vector3(x, 0, z).normalize();
    const tab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 3.6), M.darkSteel);
    tab.position.set(x + d.x * 1.1, 1.15, z + d.z * 1.1); tab.rotation.y = Math.atan2(-d.z, d.x) + Math.PI / 2; clamps.add(tab);
    clamps.add(at(boxHit(M, 2.8, 0.8, 4.2), tab.position.x, 1.25, tab.position.z));
  }
  mv.add(clamps); parts.clamps = clamps;
  parts.stem = stemGroup(M, R + 1.2, gold, 0.55, 2.15, 2.4); mv.add(parts.stem);

  // ── lado esfera: el espectáculo (turbillón, diamante, oso, subesfera) ──
  const ds = new THREE.Group(); ds.name = 'dialSide'; ds.rotation.z = Math.PI; mv.add(ds);
  const ys = { dial: 0.42, hour: 1.55, min: 1.72, sec: 1.88 };
  const dial = tag(new THREE.Group(), 'dial');
  const skyMat = new THREE.MeshStandardMaterial({ map: TX.galaxyTexture(watch.astral.sky), roughness: 0.85, metalness: 0.05, emissive: new THREE.Color(watch.astral.sky === 'blue' ? 0x061433 : 0x1a0830), emissiveIntensity: 0.35 });
  const sky = new THREE.Mesh(new THREE.CircleGeometry(13.5, 96).rotateX(-Math.PI / 2), skyMat); sky.position.y = 0.22; dial.add(sky);
  dial.add(new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.2, 8, 80).rotateX(Math.PI / 2), gold));
  dial.add(hitProxy(M, 13.5, 0.4, 0.25)); ds.add(dial); parts.dial = dial;

  const place = (obj, key) => { at(obj, L[key][0], 1.15, L[key][1]); ds.add(obj); parts[obj.name] = obj; return obj; };

  const timeDial = tag(new THREE.Group(), 'timeDial');
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.55, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.subdialTexture(), roughness: 0.35, metalness: 0.65 }));
  face.position.y = 0.08; timeDial.add(face);
  timeDial.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.16, 8, 40).rotateX(Math.PI / 2), gold));
  timeDial.add(hitProxy(M, 2.6, 0.4, 0.15));
  place(timeDial, 'time');

  const [tx, tz] = L.time;
  const hour = tinyHand(M, 'hourHand', 1.55, 0.28, 1.42); at(hour, tx, 1.42, tz); ds.add(hour); parts.hourHand = hour;
  const min = tinyHand(M, 'minHand', 2.15, 0.18, 1.58); at(min, tx, 1.58, tz); ds.add(min); parts.minHand = min;
  const sec = tinyHand(M, 'secHand', 2.35, 0.08, 1.74); at(sec, tx, 1.74, tz); ds.add(sec); parts.secHand = sec;

  const bearCage = tag(new THREE.Group(), 'bearCage');
  const bearSpin = new THREE.Group(); bearSpin.name = 'cageSpin';
  bearSpin.add(stoneRing(gold, 2.55, 0.15));
  bearSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.08, 8, 32).rotateX(Math.PI / 2), M.steel));
  bearCage.add(bearSpin);
  bearCage.add(new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.22, 10, 40).rotateX(Math.PI / 2), gold));
  bearCage.add(hitProxy(M, 3.0, 0.7, 0.3));
  place(bearCage, 'bear');
  const bear = tag(new THREE.Group(), 'bear');
  bear.add(bearFace(images, watch.astral.bear, 2.15));
  bear.add(new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.35, 32), M.darkSteel));
  bear.add(hitProxy(M, 2.2, 0.5, 0.2));
  at(bear, L.bear[0], 1.28, L.bear[1]); ds.add(bear); parts.bear = bear;

  const diamondCage = tag(new THREE.Group(), 'diamondCage');
  const diaSpin = new THREE.Group(); diaSpin.name = 'cageSpin';
  diaSpin.add(stoneRing(M.steel, 2.35, 0.2));
  diaSpin.add(new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.07, 6, 28).rotateX(Math.PI / 2), goldB));
  diamondCage.add(diaSpin);
  diamondCage.add(new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.2, 10, 36).rotateX(Math.PI / 2), gold));
  diamondCage.add(hitProxy(M, 2.9, 0.7, 0.3));
  place(diamondCage, 'diamond');
  const diamond = tag(new THREE.Group(), 'diamond');
  const stone = brilliant(1.35); stone.position.y = 0.55; diamond.add(stone);
  diamond.add(hitProxy(M, 1.4, 1.3, 0.45));
  at(diamond, L.diamond[0], 1.25, L.diamond[1]); ds.add(diamond); parts.diamond = diamond;

  const balance = tag(new THREE.Group(), 'balance');
  const cageSpin = new THREE.Group(); cageSpin.name = 'cageSpin';
  cageSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.12, 8, 36).rotateX(Math.PI / 2), M.steel));
  cageSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.08, 8, 28).rotateX(Math.PI / 2), goldB));
  for (let k = 0; k < 3; k++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), M.steel);
    const a = k / 3 * Math.PI * 2; pillar.position.set(Math.cos(a) * 2.15, 0.15, Math.sin(a) * 2.15); cageSpin.add(pillar);
  }
  const wheelG = new THREE.Group(); wheelG.name = 'balanceWheel';
  wheelG.add(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.12, 8, 28).rotateX(Math.PI / 2), M.goldWheel));
  for (let k = 0; k < 3; k++) { const armM = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.16), M.goldWheel); armM.position.x = 0.6; const p = new THREE.Group(); p.rotation.y = k * Math.PI * 2 / 3; p.add(armM); wheelG.add(p); }
  const pts = []; for (let t = 0.4; t < 9 * Math.PI; t += 0.2) { const rr = 0.25 + t * 0.045; pts.push(new THREE.Vector3(Math.cos(t) * rr, 0.15, Math.sin(t) * rr)); }
  wheelG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.025, 4), M.blueSpring));
  cageSpin.add(wheelG); balance.add(cageSpin);
  const cock = new THREE.Mesh(extrudeShape(polyShape([[-1.2, -3.3], [1.2, -3.3], [3.3, -0.4], [2.6, 1.3], [-2.6, 1.3], [-3.3, -0.4]]), 0.28, 0.02), M.bridgeGilt);
  cock.position.y = 0.85; balance.add(cock);
  balance.add(at(jewelMesh(M, 0.28), 0, 1.15, 0));
  balance.add(hitProxy(M, 3.2, 1.3, 0.45));
  place(balance, 'balance');

  const bridge = tag(new THREE.Group(), 'trainBridge');
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.4, 24), gold); hub.position.y = 0.45; bridge.add(hub);
  bridge.add(at(brilliant(0.42), 0, 0.85, 0));
  for (const key of ['time', 'bear', 'diamond', 'balance']) for (const m of arm(M, L[key][0] * 0.55, L[key][1] * 0.55)) bridge.add(m);
  bridge.add(hitProxy(M, 1.6, 0.6, 0.45));
  at(bridge, 0, 1.2, 0); ds.add(bridge); parts.trainBridge = bridge;

  const gears = [
    ['secondWheel', 1.6, 2.4, 1.7, 28],
    ['thirdWheel', -2.2, -1.5, 2.05, 32],
    ['interWheel', 2.4, -2.2, 1.45, 24],
    ['escapeWheel', -1.2, 2.6, 1.25, 18]
  ];
  for (const [id, x, z, r, n] of gears) { const w = wheel(id, x, 0.85, z, r, n); ds.add(w); parts[id] = w; }

  const protector = makeProtector(M, watch, ys); ds.add(protector);
  const screws = screwsFor(M, cal, parts);
  shadowAll(mv);
  return { mv, parts, sub, screws, dialSide: ds, protector, R, ys, wheel: wheelG, kind: 'tourbillon' };
}
