// Herramientas 3D LA FORY (con calcomanías grabadas/serigrafiadas) + timegrapher y soporte en el banco
import * as THREE from 'three';
import { makeTGScreen, velvetTexture } from './textures.js';

function imgTex(img) { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; }

export function makeTools(M, images, movR = 12.8) {
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
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.2), M.steel); tip.position.y = -5.4; tip.name = 'tip'; g.add(tip);
    g.add(wrapDecal(2.2, 7, engrave, 14));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 1.2, 24), anod(0xd8a133)); band.position.y = 21.6; band.name = 'band'; g.add(band);
    g.userData.setSize = (sz) => { tip.scale.x = sz / 1.0; const cols = { 0.8: 0xc23b3b, 1: 0xd8a133, 1.2: 0x3aa35b, 1.4: 0x2a6fd8, 1.6: 0x8b4bd0 }; band.material.color.set(cols[sz] || 0xffffff); };
    models.screwdriver = g; }
  // Cuchilla de fondo a presión
  { const g = new THREE.Group();
    const h = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 2), plastic(0x6b3b1f)); h.position.y = 14; g.add(h);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 8, 0.25), M.steel); bl.position.y = 3; g.add(bl);
    const d = flatDecal(2.6, engrave); d.position.set(0, 15, 1.02); g.add(d);
    models.caseKnife = g; }
  // Multímetro con puntas
  { const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 18), plastic(0xe0b81f)); b.position.y = 1.5; g.add(b);
    const sc = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 6), plastic(0x9fc8a0)); sc.position.set(0, 3.05, -4.5); g.add(sc);
    for (const [x, c] of [[-2.5, 0xd32f2f], [2.5, 0x111111]]) { const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 12, 8), plastic(c)); pr.position.set(x, 6, 10); pr.rotation.x = -0.6; g.add(pr); }
    const d = flatDecal(4, print); d.rotation.x = -Math.PI / 2; d.position.set(0, 3.06, 3.5); g.add(d);
    models.meter = g; }
  // Pinzas plásticas
  { const g = new THREE.Group();
    for (const s2 of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 24, 0.8), plastic(0xf0f0f0)); arm.position.set(s2 * 1.5, 12, 0); arm.rotation.z = s2 * 0.06; g.add(arm); }
    const d = flatDecal(3, print); d.position.set(1.6, 16, 0.42); g.add(d);
    models.plasticTweezers = g; }
  // Protector de esfera
  { const g = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.3, 40), M.protector); disc.position.y = 1; g.add(disc); const tab = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 6), plastic(0x6ec6ff)); tab.position.set(0, 1, 11); g.add(tab); models.dialProtector = g; }
  // Prensa de agujas
  { const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 3, 24), plastic(0x1a1a1a)); base.position.y = 1.5; g.add(base);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 16, 12), M.steel); col.position.set(-4, 9, 0); g.add(col);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 2.4), M.steel); arm.position.set(0, 16, 0); g.add(arm);
    const punch = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 6, 12), plastic(0xd8a133)); punch.position.set(2, 12, 0); g.add(punch);
    const d = flatDecal(4, engrave); d.position.set(0, 16, 1.25); g.add(d);
    models.handPress = g; }
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
  // Lupa de relojero ×10: copa de cuerno (carey) con estriado, aro de oro que sujeta la lente biconvexa y filete grabado LA FORY
  { const g = new THREE.Group();
    const tc = document.createElement('canvas'); tc.width = tc.height = 256; const x = tc.getContext('2d');
    x.fillStyle = '#3a1a08'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 140; i++) { const r = 6 + Math.random() * 26; const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); const c = ['rgba(176,96,30,', 'rgba(120,58,16,', 'rgba(214,140,60,', 'rgba(30,12,4,'][i % 4]; gr.addColorStop(0, c + '.55)'); gr.addColorStop(1, c + '0)'); x.save(); x.translate(Math.random() * 256, Math.random() * 256); x.scale(1, 0.5 + Math.random()); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill(); x.restore(); }
    const horn = new THREE.MeshPhysicalMaterial({ map: new THREE.CanvasTexture(tc), roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }); horn.map.colorSpace = THREE.SRGBColorSpace; horn.side = THREE.DoubleSide;
    const prof = [[5.2, 4.2], [5.5, 5.0], [5.9, 7.0], [6.6, 9.6], [7.3, 11.6], [7.5, 12.2], [7.0, 12.4]].map(([r, y]) => new THREE.Vector2(r, y));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), horn); g.add(cup);
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; const r = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.6, 0.5), horn); r.position.set(Math.cos(a) * 7.35, 11.2, Math.sin(a) * 7.35); r.rotation.y = -a; g.add(r); }
    const gold = new THREE.MeshStandardMaterial({ color: 0xe2b85c, metalness: 1, roughness: 0.18 });
    const bez = new THREE.Mesh(new THREE.CylinderGeometry(5.75, 5.95, 1.6, 48, 1, true), gold); bez.material.side = THREE.DoubleSide; bez.position.y = 4.4; g.add(bez);
    for (const y of [3.6, 5.2]) { const t = new THREE.Mesh(new THREE.TorusGeometry(5.85, 0.22, 10, 48).rotateX(Math.PI / 2), gold); t.position.y = y; g.add(t); }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(7.25, 0.32, 10, 48).rotateX(Math.PI / 2), gold); rim.position.y = 12.3; g.add(rim);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xeef8ff, metalness: 0, roughness: 0, transparent: true, opacity: 0.32, depthWrite: false, // sin transmission: evita un pase de render extra en móvil
       clearcoat: 1, envMapIntensity: 1.4 });
    for (const sy of [1, -1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(14, 40, 8, 0, Math.PI * 2, 0, Math.asin(5.7 / 14)), glass); if (sy < 0) cap.rotation.x = Math.PI; cap.position.y = 4.4 + sy * (0.25 - 14 * Math.cos(Math.asin(5.7 / 14))); cap.renderOrder = 4; g.add(cap); }
    g.add(wrapDecal(6.2, 3.2, print, 8.0));
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

  // ── Soporte de movimiento: aro con hueco central (las piezas del lado de abajo no chocan) + mordazas ──
  const holder = new THREE.Group(); holder.userData.partId = 'holderBench';
  const ringM = new THREE.Mesh(new THREE.LatheGeometry([[movR + 0.6, 7.6], [movR + 6.5, 7.6], [movR + 6.5, 9.0], [movR + 0.6, 9.0]].map(([r, y]) => new THREE.Vector2(r, y)), 64), plastic(0x2f2f33)); ringM.material.side = THREE.DoubleSide; holder.add(ringM);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 7.6, 12), M.darkSteel); leg.position.set(Math.cos(a) * (movR + 4), 3.8, Math.sin(a) * (movR + 4)); holder.add(leg); }
  for (const sx of [-1, 1]) { const jaw = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 6), M.steel); jaw.position.set(sx * (movR + 1.3), 9.6, 0); holder.add(jaw); }
  const hd = flatDecal(7, engrave); hd.rotation.x = -Math.PI / 2; hd.position.set(0, 9.02, movR + 3.6); holder.add(hd);
  holder.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });

  // ── Bandeja de piezas. 6 × 10: el ZX-60 deja 59 piezas (el Orbital 53) y el movimiento va al soporte.
  const COLS = 6, ROWS = 10, CW = 17, RH = 16.6, x0 = 1, z0 = -1;
  const trayW = COLS * CW, trayD = ROWS * RH;
  const tcx = x0 + trayW / 2, tcz = z0 + trayD / 2;
  const tray = new THREE.Group();
  const tb = new THREE.Mesh(new THREE.BoxGeometry(trayW + 2, 1.2, trayD + 4), new THREE.MeshStandardMaterial({ map: velvetTexture('#0d2a20', 6), roughness: 1 })); tb.position.set(tcx, 0.6, tcz); tray.add(tb);
  const wallM = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.5 }); const trimM = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 1, roughness: 0.3 });
  for (let i = 0; i <= COLS; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, trayD), wallM); w.position.set(x0 + i * CW, 1.6, tcz); tray.add(w); if (i === 0 || i === COLS) { const t2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, trayD), trimM); t2.position.set(x0 + i * CW, 2.9, tcz); tray.add(t2); } }
  for (let j = 0; j <= ROWS; j++) { const w = new THREE.Mesh(new THREE.BoxGeometry(trayW, 2.4, 0.8), wallM); w.position.set(tcx, 1.6, z0 + j * RH); tray.add(w); }
  const td = flatDecal(14, print); td.rotation.x = -Math.PI / 2; td.position.set(tcx, 1.25, z0 + trayD + 10); tray.add(td);
  tray.traverse(o => { if (o.isMesh && !o.material.transparent) o.receiveShadow = true; });
  const traySlot = (i) => new THREE.Vector3(x0 + CW / 2 + (i % COLS) * CW, 1.4, z0 + RH / 2 + Math.floor(i / COLS) * RH);
  const trayCenter = new THREE.Vector3(tcx, 0, tcz);
  const traySize = Math.max(trayW, trayD) + 22;

  return { models, tg, tgScreen: scr, screen, holder, tray, traySlot, trayCenter, traySize, logoMat };
}
