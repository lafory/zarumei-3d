// Calibre ZX-60 Habana. Turbillón volante, subesfera, oso, diamante, autómatas,
// repetición de minutos y calendario. 60 piezas: más que el ZC-43.
// Los tornillos coinciden con ZX60 en src/data/calibers.js.
import * as THREE from 'three';
import * as TX from './textures.js';
import { extrudeShape, polyShape, gearMesh, hitProxy, tag, at, cyl, jewelMesh, shadowAll } from './geom.js';
import { screwsFor, stemGroup, makeProtector } from './movement.js';

const L = {
  time: [-0.55, -7.15], palm: [-6.5, -5.5], colibri: [5.7, -6.05], balance: [-6.35, -0.15],
  bear: [6.15, 1.35], diamond: [-3.15, 5.35], castle: [1.7, 7.35], bee: [-7.7, 3.7]
};
const diamondMat = () => new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0.05, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
  emissive: 0xb9c7dc, emissiveIntensity: 0.35, envMapIntensity: 1.1
});
function brilliant(r) {
  const g = new THREE.Group(), m = diamondMat();
  const crown = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.62, 12), m); crown.position.y = r * 0.28; g.add(crown);
  const pav = new THREE.Mesh(new THREE.ConeGeometry(r * 0.98, r * 0.95, 12), m); pav.rotation.z = Math.PI; pav.position.y = -r * 0.32; g.add(pav);
  return g;
}
function tinyHand(M, id, len, w, y) {
  const g = tag(new THREE.Group(), id);
  const inner = new THREE.Group(); inner.name = 'rot'; g.add(inner);
  const s = new THREE.Shape();
  s.moveTo(0, -0.22); s.quadraticCurveTo(-w, len * 0.45, 0, len); s.quadraticCurveTo(w, len * 0.45, 0, -0.22); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  inner.add(new THREE.Mesh(geo, M.metal('gold')));
  inner.add(at(cyl(0.14, 0.08, M.goldChaton, 10), 0, 0, 0));
  const hp = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.8, w + 0.3), 0.3, len + 0.35), M.hit);
  hp.userData.isHit = true; hp.position.set(0, 0.05, -len * 0.35); inner.add(hp);
  g.position.y = y; return g;
}
function groundMat(kind) {
  if (kind === 'nacre') return new THREE.MeshPhysicalMaterial({ map: TX.nacreTexture(), roughness: 0.22, metalness: 0.06, clearcoat: 0.65, clearcoatRoughness: 0.18 });
  if (kind === 'tropic') return new THREE.MeshStandardMaterial({ map: TX.tropicTexture(), roughness: 0.48, metalness: 0.02 });
  return new THREE.MeshStandardMaterial({ map: TX.galaxyTexture('blue'), roughness: 0.9, metalness: 0.02, emissive: new THREE.Color(0x061433), emissiveIntensity: 0.16 });
}
function cubaCap() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 80;
  const x = c.getContext('2d');
  x.font = '900 62px Helvetica, Arial'; x.textBaseline = 'middle';
  'CUBA'.split('').forEach((ch, i) => { x.fillStyle = ['#e23b2f', '#f7f7f7', '#2f6bff', '#e23b2f'][i]; x.fillText(ch, 12 + i * 60, 42); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bearRelief(M) {
  const g = new THREE.Group();
  const fur = new THREE.MeshPhysicalMaterial({ color: 0x1a4ed8, metalness: 0.35, roughness: 0.38, clearcoat: 0.4, emissive: 0x061433, emissiveIntensity: 0.18 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 18, 14), fur); body.scale.set(1.15, 0.4, 1.2); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.02, 16, 12), fur); head.scale.set(1.05, 0.48, 0.95); head.position.set(0, 0.1, -1.5); g.add(head);
  for (const sx of [-0.62, 0.62]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), fur); e.scale.y = 0.42; e.position.set(sx, 0.18, -2.25); g.add(e); }
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd5e2f6, roughness: 0.42 }));
  snout.scale.y = 0.4; snout.position.set(0, 0.26, -2.05); g.add(snout);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.45 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 0.26, 16), capMat); cap.position.set(0, 0.4, -1.62); g.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.48), capMat); brim.position.set(0, 0.3, -2.35); g.add(brim);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.44).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: cubaCap(), transparent: true }));
  label.position.set(0, 0.55, -1.58); g.add(label);
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0c1a44 }));
  patch.position.set(0.5, 0.38, -1.62); g.add(patch);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: 0xf4f4f4, metalness: 0.2, roughness: 0.35 }));
  star.position.set(0.5, 0.5, -1.62); g.add(star);
  const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0xd7263d }));
  cheek.position.set(-0.42, 0.34, -1.75); g.add(cheek);
  for (let i = 0; i < 6; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 8), M.metal('steel'));
    link.position.set(-0.1 + i * 0.22, 0.18, -0.05); g.add(link);
  }
  g.add(at(brilliant(0.26), 1.25, 0.28, 0.05));
  g.add(hitProxy(M, 2.2, 0.85, 0.22));
  return g;
}
function palmTree(M) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 1.8, 7), new THREE.MeshStandardMaterial({ color: 0x8a6230, roughness: 0.7 }));
  trunk.position.y = 0.9; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x1f8a3a, roughness: 0.55 });
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const fr = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.25, 5), leaf);
    fr.position.set(Math.cos(a) * 0.55, 1.85, Math.sin(a) * 0.55);
    fr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0.4, Math.sin(a)).normalize());
    g.add(fr);
  }
  g.add(hitProxy(M, 0.95, 2.1, 0.95));
  return g;
}
function hummingbird(M) {
  const g = new THREE.Group(); const spin = new THREE.Group(); spin.name = 'cageSpin'; g.add(spin);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1fa86a, roughness: 0.4, metalness: 0.12 }));
  body.scale.set(0.7, 0.4, 1.25); spin.add(body);
  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd23a4a }));
  throat.position.set(0, 0.08, -0.4); spin.add(throat);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.62, 6), M.metal('gold'));
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.02, -0.95); spin.add(beak);
  const wingM = new THREE.MeshStandardMaterial({ color: 0xe7f6ee, roughness: 0.35, transparent: true, opacity: 0.8 });
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 6), wingM); w.scale.set(1.2, 0.1, 0.5); w.position.set(sx * 0.62, 0.04, 0); spin.add(w);
  }
  g.add(hitProxy(M, 1.05, 0.5, 0.12));
  return g;
}
function honeyBee(M) {
  const g = new THREE.Group(); const spin = new THREE.Group(); spin.name = 'cageSpin'; g.add(spin);
  const yel = new THREE.MeshStandardMaterial({ color: 0xf0c21a, roughness: 0.4 });
  const blk = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.45 });
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), yel); a.scale.set(0.8, 0.55, 1.1); spin.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), blk); b.position.z = 0.38; b.scale.y = 0.5; spin.add(b);
  const wing = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), wing); w.scale.set(1.1, 0.08, 0.45); w.position.set(sx * 0.32, 0.12, -0.05); spin.add(w); }
  g.add(hitProxy(M, 0.7, 0.4, 0.1));
  return g;
}
function morro(M) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0d48a, metalness: 0.85, roughness: 0.28, emissive: 0x6a4e16, emissiveIntensity: 0.35 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 1.3), gold); base.position.y = 0.22; g.add(base);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 0.9), gold); wall.position.y = 0.7; g.add(wall);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 1.15, 8), gold); tower.position.set(0.7, 0.85, 0); g.add(tower);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); dome.position.set(0.7, 1.4, 0); g.add(dome);
  g.add(hitProxy(M, 1.4, 1.5, 0.6));
  return g;
}
export function buildZX60(M, images, watch, cal) {
  const R = 13.4, gold = M.metal('gold'), goldB = M.metal('gold', true);
  const mv = tag(new THREE.Group(), 'movement'); const parts = {}; const sub = {};
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.05, 80), [M.darkSteel, M.plateBrass, M.plateBrass]);
  plate.position.y = 0.52; mv.add(plate);

  const barrel = tag(new THREE.Group(), 'barrel');
  barrel.add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.45, 32), goldB));
  barrel.add(at(gearMesh(4.4, 56, 0.2, M.goldWheel, 0), 0, 0.12, 0));
  const spr = []; for (let t = 0; t < 11 * Math.PI; t += 0.28) { const rr = 0.75 + t * 0.09; spr.push(new THREE.Vector3(Math.cos(t) * rr, 0.35, Math.sin(t) * rr)); }
  const mainspring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spr), 120, 0.045, 4), new THREE.MeshStandardMaterial({ color: 0x6a5438, metalness: 0.7, roughness: 0.55 }));
  mainspring.visible = false; barrel.add(mainspring); barrel.add(hitProxy(M, 4.6, 1.5, 0.65));
  at(barrel, -3.2, 1.15, -4.4); mv.add(barrel); parts.barrel = barrel; sub.mainspring = mainspring; sub.barrelDrum = barrel.children[0];
  const bb = tag(new THREE.Group(), 'barrelBridge');
  bb.add(new THREE.Mesh(extrudeShape(polyShape([[-8.2, -1.2], [-7.4, -8.6], [1.4, -8.8], [1.6, -1.4], [-2.2, 0.4]]), 0.7), M.bridgeGilt));
  bb.add(at(jewelMesh(M, 0.32), -3.2, 0.72, -4.4));
  bb.add(at(hitProxy(M, 5.4, 0.9, 0), -3.2, 0.5, -4.2));
  at(bb, 0, 2.15, 0); mv.add(bb); parts.barrelBridge = bb;
  const ratchet = tag(new THREE.Group(), 'ratchet');
  ratchet.add(gearMesh(2.4, 32, 0.26, M.steel, 0));
  ratchet.add(at(cyl(0.72, 0.1, M.steel, 16), 0, 0.12, 0));
  ratchet.add(hitProxy(M, 2.55, 1.7, -0.2));
  at(ratchet, -3.2, 2.95, -4.4); mv.add(ratchet); parts.ratchet = ratchet;
  const cw = tag(new THREE.Group(), 'crownWheel');
  cw.add(gearMesh(1.5, 20, 0.24, M.steel, 0));
  cw.add(at(cyl(0.5, 0.1, M.steel, 14), 0, 0.1, 0));
  cw.add(hitProxy(M, 1.65, 1.55, -0.2));
  at(cw, -6.6, 2.9, -1.8); mv.add(cw); parts.crownWheel = cw;
  const click = tag(new THREE.Group(), 'click');
  click.add(new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.7, 0.3], [2.1, 1.05], [0.35, 0.95]]), 0.26, 0.02), M.steel));
  click.add(hitProxy(M, 1.3, 0.4, 0.16)); at(click, -1.1, 2.9, -7.6); mv.add(click); parts.click = click;
  const pb = tag(new THREE.Group(), 'palletBridge');
  pb.add(new THREE.Mesh(extrudeShape(polyShape([[2.2, 5.2], [7.4, 4.6], [7.8, 7.2], [2.4, 7.4]]), 0.52), M.bridgeGilt));
  pb.add(at(jewelMesh(M, 0.26), 5.0, 0.55, 6.2));
  pb.add(at(hitProxy(M, 3.1, 0.7, 0), 5.0, 0.45, 6.15));
  at(pb, 0, 2.05, 0); mv.add(pb); parts.palletBridge = pb;
  const pf = tag(new THREE.Group(), 'palletFork');
  pf.add(new THREE.Mesh(extrudeShape(polyShape([[-0.22, -1.4], [0.22, -1.4], [0.18, 0.15], [0.95, 0.6], [0.8, 0.95], [0, 0.48], [-0.8, 0.95], [-0.95, 0.6], [-0.18, 0.15]]), 0.12, 0.01), M.steel));
  for (const sx of [0.85, -0.85]) pf.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.32), M.ruby), sx, 0.08, 0.75));
  pf.add(hitProxy(M, 1.15, 0.35, 0.12)); at(pf, 5.0, 1.35, 6.0); mv.add(pf); parts.palletFork = pf;
  const clamps = tag(new THREE.Group(), 'clamps');
  for (const [x, z] of [[-8.4, 8.2], [9.2, -5.4]]) {
    const d = new THREE.Vector3(x, 0, z).normalize();
    const tab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 3.4), M.darkSteel);
    tab.position.set(x + d.x * 1.05, 1.12, z + d.z * 1.05); tab.rotation.y = Math.atan2(-d.z, d.x) + Math.PI / 2; clamps.add(tab);
    clamps.add(at(hitProxy(M, 1.5, 0.55, 1.15), x, 0, z));
  }
  mv.add(clamps); parts.clamps = clamps;
  parts.stem = stemGroup(M, R + 1.1, gold, 0.55, 2.05, 2.3); mv.add(parts.stem);

  const ds = new THREE.Group(); ds.name = 'dialSide'; ds.rotation.z = Math.PI; mv.add(ds);
  const ys = { dial: 0.55, hour: 1.55, min: 1.7, sec: 1.85 };
  const dial = tag(new THREE.Group(), 'dial');
  const sky = new THREE.Mesh(new THREE.CircleGeometry(13.6, 80).rotateX(-Math.PI / 2), groundMat(watch.habana));
  sky.position.y = 0.78; dial.add(sky);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(13.55, 0.18, 8, 64).rotateX(Math.PI / 2), gold);
  rim.position.y = 0.78; dial.add(rim);
  dial.add(hitProxy(M, 13.5, 0.4, 0.78)); ds.add(dial); parts.dial = dial;

  const place = (obj, key, y) => { at(obj, L[key][0], y, L[key][1]); ds.add(obj); parts[obj.name] = obj; return obj; };
  const wheel = (id, x, z, r, n) => {
    const w = tag(new THREE.Group(), id);
    w.add(gearMesh(r, n, 0.14, M.goldWheel, r > 1.5 ? 4 : 0));
    w.add(at(cyl(0.16, 0.55, M.steel, 8), 0, -0.2, 0));
    w.add(hitProxy(M, r + 0.2, 0.4, 0.12));
    at(w, x, 0.85, z); ds.add(w); parts[id] = w;
  };

  const timeDial = tag(new THREE.Group(), 'timeDial');
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.45, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.habanaSubdial(), roughness: 0.4, metalness: 0.12 }));
  face.position.y = 0.06; timeDial.add(face);
  timeDial.add(new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.14, 8, 36).rotateX(Math.PI / 2), gold));
  timeDial.add(hitProxy(M, 2.5, 0.35, 0.12));
  place(timeDial, 'time', 1.12);
  const [tx, tz] = L.time;
  const hour = tinyHand(M, 'hourHand', 1.45, 0.26, 1.4); at(hour, tx, 1.4, tz); ds.add(hour); parts.hourHand = hour;
  const min = tinyHand(M, 'minHand', 2.05, 0.16, 1.55); at(min, tx, 1.55, tz); ds.add(min); parts.minHand = min;
  const sec = tinyHand(M, 'secHand', 2.2, 0.07, 1.7); at(sec, tx, 1.7, tz); ds.add(sec); parts.secHand = sec;

  const bearCage = tag(new THREE.Group(), 'bearCage');
  const bearSpin = new THREE.Group(); bearSpin.name = 'cageSpin';
  bearSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.1, 8, 28).rotateX(Math.PI / 2), goldB));
  bearCage.add(bearSpin);
  bearCage.add(new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.16, 8, 32).rotateX(Math.PI / 2), gold));
  bearCage.add(hitProxy(M, 3.0, 0.55, 0.2));
  place(bearCage, 'bear', 1.12);
  const bear = tag(new THREE.Group(), 'bear'); bear.add(bearRelief(M));
  at(bear, L.bear[0], 1.22, L.bear[1]); bear.scale.set(1.7, 1.25, 1.7); ds.add(bear); parts.bear = bear;

  const diamondCage = tag(new THREE.Group(), 'diamondCage');
  const diaSpin = new THREE.Group(); diaSpin.name = 'cageSpin';
  diaSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.08, 6, 24).rotateX(Math.PI / 2), goldB));
  diamondCage.add(diaSpin);
  diamondCage.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.16, 8, 32).rotateX(Math.PI / 2), gold));
  diamondCage.add(hitProxy(M, 2.7, 0.55, 0.2));
  place(diamondCage, 'diamond', 1.12);
  const diamond = tag(new THREE.Group(), 'diamond'); const stone = brilliant(1.55); stone.position.y = 0.55; diamond.add(stone);
  diamond.add(hitProxy(M, 1.3, 1.1, 0.4));
  at(diamond, L.diamond[0], 1.2, L.diamond[1]); ds.add(diamond); parts.diamond = diamond;

  const balance = tag(new THREE.Group(), 'balance');
  const cageSpin = new THREE.Group(); cageSpin.name = 'cageSpin';
  cageSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.1, 8, 32).rotateX(Math.PI / 2), M.steel));
  cageSpin.add(new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.07, 6, 24).rotateX(Math.PI / 2), goldB));
  for (let k = 0; k < 3; k++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.15, 6), M.steel);
    const a = k / 3 * Math.PI * 2; pillar.position.set(Math.cos(a) * 2.05, 0.1, Math.sin(a) * 2.05); cageSpin.add(pillar);
  }
  const wheelG = new THREE.Group(); wheelG.name = 'balanceWheel';
  wheelG.add(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 6, 20).rotateX(Math.PI / 2), M.goldWheel));
  const pts = []; for (let t = 0.4; t < 8 * Math.PI; t += 0.25) { const rr = 0.22 + t * 0.04; pts.push(new THREE.Vector3(Math.cos(t) * rr, 0.12, Math.sin(t) * rr)); }
  wheelG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 100, 0.02, 4), M.blueSpring));
  cageSpin.add(wheelG); balance.add(cageSpin);
  const cock = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 6, 28).rotateX(Math.PI / 2), M.bridgeGilt);
  cock.position.y = 0.98; balance.add(cock); balance.add(at(jewelMesh(M, 0.22), 0, 1.12, 0));
  balance.add(hitProxy(M, 3.0, 1.15, 0.4));
  place(balance, 'balance', 1.15);

  const nest = (id, rad) => {
    const g = tag(new THREE.Group(), id);
    g.add(gearMesh(rad, rad > 1 ? 16 : 12, 0.12, M.steel, 0));
    g.add(hitProxy(M, rad + 0.25, 0.35, 0.1));
    at(g, L.balance[0], 0.95, L.balance[1]); ds.add(g); parts[id] = g;
  };
  nest('fixedWheel', 1.7); nest('cageEscape', 0.85); nest('cagePallet', 0.55);

  const bridge = tag(new THREE.Group(), 'trainBridge');
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.32, 20), gold); hub.position.y = 0.42; bridge.add(hub);
  bridge.add(at(jewelMesh(M, 0.28), 0, 0.7, 0));
  for (const key of ['time', 'bear', 'diamond', 'balance']) {
    const len = Math.hypot(L[key][0], L[key][1]);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, len * 0.8), gold);
    bar.position.set(L[key][0] * 0.42, 0.06, L[key][1] * 0.42);
    bar.rotation.y = Math.atan2(L[key][0], L[key][1]); bridge.add(bar);
    bridge.add(at(jewelMesh(M, 0.16), L[key][0] * 0.78, 0.18, L[key][1] * 0.78));
  }
  bridge.add(hitProxy(M, 1.5, 0.5, 0.4));
  at(bridge, 0, 1.15, 0); ds.add(bridge); parts.trainBridge = bridge;
  wheel('secondWheel', 1.7, 1.55, 1.15, 22);
  wheel('thirdWheel', -1.65, 1.4, 1.35, 26);
  wheel('interWheel', 1.45, -1.5, 1.05, 20);
  wheel('escapeWheel', -1.5, -1.45, 0.95, 16);
  wheel('centerWheel', 0.15, 0.05, 1.55, 28);

  const deco = (id, key, y, node) => { const g = tag(new THREE.Group(), id); g.add(node); at(g, L[key][0], y, L[key][1]); ds.add(g); parts[id] = g; };
  deco('palm', 'palm', 1.05, palmTree(M));
  deco('colibri', 'colibri', 1.2, hummingbird(M));
  deco('castle', 'castle', 1.05, morro(M));
  deco('bee', 'bee', 1.15, honeyBee(M));
  parts.palm.scale.setScalar(1.55);
  parts.castle.scale.setScalar(1.85);
  parts.colibri.scale.setScalar(1.7);
  parts.bee.scale.setScalar(2.2);

  const low = (id, x, z, mesh, hr, hh) => {
    const g = tag(new THREE.Group(), id); g.add(mesh); g.add(hitProxy(M, hr, hh, 0.12));
    at(g, x, 0.2, z); ds.add(g); parts[id] = g; return g;
  };
  low('repeaterSlide', -6.4, -1.6, new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.7), M.steel), 1.4, 0.3);
  low('rack', -4.2, -3.4, gearMesh(1.15, 18, 0.16, M.steel, 0), 1.3, 0.3);
  low('snail', -2.1, -4.6, new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 0.2, 16), M.steel), 1.05, 0.28);
  low('quarterSnail', 0.1, -5.3, new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 0.18, 12), goldB), 0.85, 0.26);
  low('minuteRack', -8.1, 1.6, gearMesh(0.9, 14, 0.14, M.steel, 0), 1.05, 0.28);
  low('hourSnail', -6.1, 4.3, new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.18, 12), M.steel), 0.95, 0.26);
  low('hammer', 5.6, -3.1, new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.6, 0.2], [1.8, 0.7], [0.3, 0.55]]), 0.2, 0.01), M.steel), 1.1, 0.3);
  const gongMesh = new THREE.Mesh(new THREE.TorusGeometry(10.6, 0.08, 6, 48, Math.PI * 1.3).rotateX(Math.PI / 2), M.blueSpring);
  gongMesh.userData.noPick = true; gongMesh.raycast = () => {};
  low('gong', 0, 0, gongMesh, 0.45, 0.2);
  low('allOrNothing', 4.3, -5.5, new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.7), M.steel), 0.9, 0.26);
  const gov = new THREE.Group();
  gov.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 16), M.steel));
  for (let k = 0; k < 4; k++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.22), goldB); fin.position.x = 0.4; const p = new THREE.Group(); p.rotation.y = k * Math.PI / 2; p.add(fin); gov.add(p); }
  low('governor', 8.2, 2.5, gov, 1.05, 0.3);
  const calPlate = new THREE.Mesh(extrudeShape(polyShape([[-7.5, -1], [7.6, -0.6], [8.2, 2.2], [1.2, 8.6], [-6.4, 6.2], [-8, 1.4]]), 0.22, 0.02), M.bridgeGilt);
  low('calendarPlate', 0, 2.2, calPlate, 3.2, 0.3);
  low('dayDisc', -2.8, 3.2, new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 24), M.whiteDisc || M.plateBrass), 1.25, 0.22);
  low('monthDisc', 2.6, 3.6, new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 24), M.plateBrass), 1.15, 0.22);
  low('leapWheel', 0.2, 5.6, gearMesh(0.7, 12, 0.12, M.goldWheel, 0), 0.85, 0.24);
  const moon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x14203a, roughness: 0.5, metalness: 0.2 }));
  low('moonDisc', 5.4, 5.1, moon, 1.3, 0.24);
  low('moonWheel', 5.4, 6.7, gearMesh(0.55, 10, 0.12, M.steel, 0), 0.7, 0.22);
  low('dateJumper', -5.1, 6.1, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.4), M.steel), 0.75, 0.24);
  low('starWheel', -1.4, -2.5, gearMesh(0.85, 8, 0.16, M.goldWheel, 0), 1.0, 0.26);
  low('hourWheel', 0, 0.2, gearMesh(1.7, 28, 0.14, M.goldWheel, 0), 1.85, 0.26);
  low('minuteWheel', 3.1, -0.3, gearMesh(1.05, 18, 0.12, M.goldWheel, 0), 1.2, 0.24);
  low('cannonPinion', 0, 0.15, new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 10), M.steel), 0.55, 0.4);
  low('keylessPlate', 6.6, -0.8, new THREE.Mesh(extrudeShape(polyShape([[-1.2, -1.4], [1.6, -1.2], [1.8, 1.1], [-0.8, 1.3]]), 0.16, 0.01), M.steel), 1.5, 0.26);
  low('yoke', 5.0, 0.7, new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.4, 0.3], [1.2, 0.8], [0.1, 0.55]]), 0.14, 0.01), M.steel), 0.9, 0.24);
  low('settingLever', 6.9, 1.5, new THREE.Mesh(extrudeShape(polyShape([[0, 0], [1.5, -0.2], [1.6, 0.35], [0.15, 0.4]]), 0.14, 0.01), M.steel), 0.95, 0.24);
  low('slidingPinion', 8.3, 0.15, gearMesh(0.55, 10, 0.16, M.steel, 0), 0.7, 0.24);
  low('windingPinion', 9.3, 0.2, gearMesh(0.48, 9, 0.14, M.steel, 0), 0.62, 0.22);

  const protector = makeProtector(M, watch, ys); ds.add(protector);
  const screws = screwsFor(M, cal, parts);
  for (const p of cal.parts) if (p.id !== 'movement' && p.id !== 'caseback' && !parts[p.id]) throw new Error('ZX-60 sin malla: ' + p.id);
  shadowAll(mv);
  void images;
  return { mv, parts, sub, screws, dialSide: ds, protector, R, ys, wheel: wheelG, kind: 'tourbillon' };
}
