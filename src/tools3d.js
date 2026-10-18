// Herramientas 3D LA FURY (con calcomanías grabadas/serigrafiadas) + timegrapher y soporte en el banco
import * as THREE from 'three';
import { makeTGScreen } from './textures.js';

function imgTex(img) { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; }

export function makeTools(M, images) {
  const engrave = new THREE.MeshStandardMaterial({ map: imgTex(images.decalGold), transparent: true, metalness: 0.9, roughness: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const print = new THREE.MeshStandardMaterial({ map: imgTex(images.decalWhite), transparent: true, metalness: 0, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const logoMat = new THREE.MeshBasicMaterial({ map: imgTex(images.logo), transparent: true, depthWrite: false });
  const aspect = images.decalGold.height / images.decalGold.width;
  const plastic = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.1 });
  const anod = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.8 });

  // calcomanía envolvente en un cilindro (mango)
  function wrapDecal(r, h, mat, y = 0) {
    const g = new THREE.CylinderGeometry(r * 1.02, r * 1.02, h, 32, 1, true, -Math.PI * 0.35, Math.PI * 0.7);
    const m = new THREE.Mesh(g, mat); m.position.y = y; m.renderOrder = 3; return m;
  }
  function flatDecal(w, mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * aspect), mat); m.renderOrder = 3; return m; }

  const models = {};
  // Destornillador
  { const g = new THREE.Group();
    const h = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 18, 24), anod(0x2a50c0)); h.position.y = 14; g.add(h);
    for (let k = 0; k < 12; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.3, 14, 0.5), anod(0x1c3a90)); const a = k / 12 * Math.PI * 2; r.position.set(Math.cos(a) * 2.2, 14, Math.sin(a) * 2.2); r.rotation.y = -a; if (k % 3) g.add(r); }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 24), M.steel); cap.position.y = 23.6; g.add(cap);
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 10, 12), M.steel); blade.position.y = 0; g.add(blade);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.2), M.steel); tip.position.y = -5.4; g.add(tip);
    g.add(wrapDecal(2.2, 7, engrave, 14));
    models.screwdriver = g; }
  // Pinzas
  { const g = new THREE.Group();
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 26, 0.6), M.steel); arm.position.set(s * 1.4, 12, 0); arm.rotation.z = s * 0.06; g.add(arm); }
    const d = flatDecal(3.4, engrave); d.position.set(1.6, 16, 0.32); g.add(d);
    models.tweezers = g; }
  // Llave de fondo (Jaxa)
  { const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(34, 2.4, 4), M.steel); bar.position.y = 4; g.add(bar);
    for (const x of [-12, 12]) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 4, 10), M.darkSteel); pin.position.set(x, 1, 0); g.add(pin); }
    const pin3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 4, 10), M.darkSteel); pin3.position.set(0, 1, 9); g.add(pin3);
    const arm3 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 10), M.steel); arm3.position.set(0, 4, 5); g.add(arm3);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 4, 32), plastic(0x161616)); knob.position.y = 7; g.add(knob);
    const d = flatDecal(7, engrave); d.rotation.x = -Math.PI / 2; d.position.y = 9.05; g.add(d);
    models.caseWrench = g; }
  // Lupa
  { const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 8, 32, 1, true), plastic(0x111111)); body.material.side = THREE.DoubleSide; body.position.y = 8; g.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.6, 32), new THREE.MeshPhysicalMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.35, roughness: 0 })); lens.position.y = 4.4; g.add(lens);
    g.add(wrapDecal(7.0, 5, print, 8));
    models.loupe = g; }
  // Aceitera
  { const g = new THREE.Group();
    const h = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 16, 16), anod(0x7a1d1d)); h.position.y = 12; g.add(h);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 8, 8), M.steel); n.position.y = 0; g.add(n);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshPhysicalMaterial({ color: 0xffd36b, roughness: 0, transparent: true, opacity: 0.8 })); drop.position.y = -4; g.add(drop);
    g.add(wrapDecal(1.4, 5, engrave, 13));
    models.oiler = g; }
  // Limpieza (Rodico + frasco)
  { const g = new THREE.Group();
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 10, 24), new THREE.MeshPhysicalMaterial({ color: 0x5fb3ff, roughness: 0.1, transparent: true, opacity: 0.8 })); bottle.position.y = 5; g.add(bottle);
    const capB = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 2.4, 16), M.steel); capB.position.y = 11.2; g.add(capB);
    g.add(wrapDecal(4, 6, print, 5));
    const rodico = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 3), plastic(0x2f9be0)); rodico.position.set(7, 1.5, 0); g.add(rodico);
    models.cleaner = g; }
  // Brújula
  { const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 2.4, 32), plastic(0x222222)); b.position.y = 1.2; g.add(b);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.1, 32), plastic(0xeeeeee)); face.position.y = 2.45; g.add(face);
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.8, 9, 4).rotateX(Math.PI / 2), plastic(0xd33)); needle.position.y = 2.7; needle.name = 'needle'; g.add(needle);
    const d = flatDecal(2.6, print); d.rotation.x = -Math.PI / 2; d.position.set(0, 2.52, 3.6); g.add(d);
    models.compass = g; }
  // Desmagnetizador
  { const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 12), plastic(0x2d4f7a)); b.position.y = 3; g.add(b);
    const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 8), M.steel); top.position.y = 6.2; g.add(top);
    const d = flatDecal(5, print); d.position.set(5.6, 3.4, 6.05); g.add(d);
    models.demag = g; }
  // Palancas de agujas
  { const g = new THREE.Group();
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 0.6), M.steel); a.position.set(s * 3, 10, 0); a.rotation.z = s * 0.2; g.add(a); const h = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 8, 12), plastic(0xc99a3c)); h.position.set(s * 4.6, 17, 0); h.rotation.z = s * 0.2; g.add(h); }
    models.handLevers = g; }
  // Pera de aire
  { const g = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), plastic(0xbb2222)); bulb.position.y = 12; bulb.scale.y = 1.3; g.add(bulb);
    const nz = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 8, 12), M.steel); nz.position.y = 2; g.add(nz);
    models.blower = g; }
  for (const k in models) models[k].traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });

  // ── Timegrapher en el banco ──
  const tg = new THREE.Group(); tg.userData.partId = 'timegrapher3d';
  const scr = makeTGScreen(images.logo);
  const box = new THREE.Mesh(new THREE.BoxGeometry(60, 24, 30), plastic(0x1b1d20)); box.position.y = 12; tg.add(box);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(46, 22, 1), plastic(0x0b0b0b)); bezel.position.set(0, 14, 15.3); tg.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(42, 21), new THREE.MeshBasicMaterial({ map: scr.texture, toneMapped: false })); screen.position.set(0, 14, 15.9); tg.add(screen);
  const brand = flatDecal(7, print); brand.position.set(25, 4, 15.1); tg.add(brand);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 6, 24), M.steel); mic.position.set(-42, 3, 4); tg.add(mic);
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 3), M.darkSteel); clamp.position.set(-42, 7.5, 4); tg.add(clamp);
  tg.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });

  // ── Soporte de movimiento en el banco (con grabado LA FURY) ──
  const holder = new THREE.Group(); holder.userData.partId = 'holderBench';
  const base = new THREE.Mesh(new THREE.BoxGeometry(44, 6, 22), plastic(0x2f2f33)); base.position.y = 3; holder.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 1.6, 12, 64).rotateX(Math.PI / 2), M.darkSteel); ring.position.y = 6.5; holder.add(ring);
  for (const s of [-1, 1]) { const jaw = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 6), M.steel); jaw.position.set(s * 14.6, 7.5, 0); holder.add(jaw); }
  const hd = flatDecal(9, engrave); hd.position.set(14, 3.2, 11.05); holder.add(hd);
  const hd2 = flatDecal(9, engrave); hd2.position.set(-14, 3.2, 11.05); holder.add(hd2);
  holder.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });

  return { models, tg, tgScreen: scr, screen, holder, logoMat };
}
