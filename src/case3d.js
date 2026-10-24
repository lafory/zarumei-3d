// Cajas procedurales: 'diver' (oro o acero, fondo roscado, bisel giratorio) y 'slim' (oro rosa, fondo a presión).
import * as THREE from 'three';
import * as TX from './textures.js';
import { tag, hitProxy, boxHit } from './geom.js';
const V2 = (pts, k = 1) => pts.map(([r, y]) => new THREE.Vector2(r * k, y));

export function buildCase(M, watch, movR) {
  const C = watch.case, body = new THREE.Group();
  let metal = M.metal(C.metal), brushed = M.metal(C.metal, true);
  if (C.lacquer != null) {
    metal = new THREE.MeshPhysicalMaterial({ color: C.lacquer, metalness: 0.22, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9 });
    brushed = metal;
  }
  const k = C.r / 20;
  let dims;
  if (C.style === 'diver' || C.style === 'chrono') {
    const prof = V2([[16.3, -5.5], [18.6, -5.5], [19.6, -4.5], [20.0, -2.2], [20.0, 1.2], [19.4, 2.2], [16.3, 2.2]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(16.3 * k, 16.3 * k, 7.7, 96, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -1.65; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.1, -3.4], [16.2 * k, -3.4], [16.2 * k, -0.15], [movR + 0.1, -0.15]]), 96), M.spacer); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    for (const s of [-1, 1]) for (const xx of [-8.6, 8.6]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 10), metal); lug.position.set(xx, -1.4, s * 21.5 * k); body.add(lug); }
    if (C.crownGuards) for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.4, 2.6), metal); sh.position.set(20.6 * k, -0.9, s * 4.6); body.add(sh); }
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[16.0, 2.2], [19.6, 2.2], [19.9, 2.8], [19.4, 3.6], [16.0, 3.7]], k), 128), metal); bz.material = metal.clone(); bz.material.side = THREE.DoubleSide; body.add(bz);
    const topMat = C.lacquer != null ? metal : (C.bezel === 'ceramicBlue' || C.bezel === 'ceramicBlack')
      ? new THREE.MeshPhysicalMaterial({ map: C.bezel === 'ceramicBlack' ? TX.ceramicBlackBezel() : TX.ceramicBezelTexture(), roughness: 0.22, metalness: 0.02, clearcoat: 0.4, clearcoatRoughness: 0.28, envMapIntensity: 0.38 })
      : new THREE.MeshPhysicalMaterial({ color: metal.color, metalness: 1, roughness: 0.28, map: TX.bezelTexture(), envMapIntensity: 1.05, clearcoat: 0.25, clearcoatRoughness: 0.22 });
    const R1 = 19.3 * k, top = new THREE.Mesh(new THREE.RingGeometry(16.1 * k, R1, 128, 1).rotateX(-Math.PI / 2), topMat); top.position.y = 3.72; body.add(top);
    { const uv = top.geometry.attributes.uv, pos = top.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (2 * R1) + 0.5, -pos.getZ(i) / (2 * R1) + 0.5); }
    if (C.bezel === 'ceramicBlack') {
      const tri = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.85, 3), new THREE.MeshStandardMaterial({ color: 0xe0a07a, metalness: 0.85, roughness: 0.32 }));
      tri.rotation.x = -Math.PI / 2; tri.position.set(0, 3.95, -17.55 * k); body.add(tri);
    }
    const nG = new THREE.BoxGeometry(0.3, 0.6, 0.5); for (let i = 0; i < 120; i++) { const n = new THREE.Mesh(nG, brushed); const a = i / 120 * Math.PI * 2; n.position.set(Math.cos(a) * 19.85 * k, 2.9, Math.sin(a) * 19.85 * k); n.rotation.y = -a; body.add(n); }
    if (C.style === 'chrono') {
      const capMat = C.pusher === 'orb' ? new THREE.MeshPhysicalMaterial({ color: 0x0e0e0e, metalness: 0.8, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }) : metal;
      for (const z of [-6.4, 6.6]) {
        const geo = C.pusher === 'orb' ? new THREE.SphereGeometry(1.65, 18, 14) : new THREE.CylinderGeometry(1.1, 1.2, 2.1, 16).rotateZ(Math.PI / 2);
        const p = new THREE.Mesh(geo, capMat); p.position.set(19.6 * k, 0.2, z); body.add(p);
      }
    }
    if (C.spikes) {
      const spikeMat = M.metal('gold');
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.2, 8), spikeMat);
        cone.position.set(Math.cos(a) * 20.4 * k, 3.15, Math.sin(a) * 20.4 * k);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), 0.45, Math.sin(a)).normalize());
        body.add(cone);
      }
    }
    const crystal = new THREE.Mesh(new THREE.CylinderGeometry(16.1 * k, 16.1 * k, 0.8, 96), M.crystal); crystal.position.y = 3.3; crystal.renderOrder = 5; body.add(crystal);
    if (watch.bracelet.style === 'alligator') alligator(body, -2.2, 21.5 * k + 5.6, watch.bracelet.dye);
    else bracelet(body, M, watch, k, -2.2, 21.5 * k + 5.6, 7.6);
    dims = { cbY: -5.95, yFront: 6.55, yBack: 3.8 };
  } else if (C.style === 'astral') {
    const prof = V2([[15.2, -4.4], [18.4, -4.4], [20.4, -3.1], [20.7, 0.2], [20.0, 1.7], [17.6, 2.55], [15.2, 2.55]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(15.2 * k, 15.2 * k, 6.6, 96, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -1.1; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.15, -2.8], [15.05 * k, -2.8], [15.05 * k, 0.15], [movR + 0.15, 0.15]]), 96), M.spacer); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(20.65 * k, 20.65 * k, 1.25, 96, 1, true), brushed.clone()); band.position.y = -1.35; body.add(band);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(20.78 * k, 20.78 * k, 0.7, 128, 1, true), new THREE.MeshStandardMaterial({ color: metal.color, metalness: 1, roughness: 0.38, map: TX.engraveBand(), transparent: true })); eng.position.y = -2.45; body.add(eng);
    for (const s of [-1, 1]) for (const xx of [-6.4, 6.4]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.8, 6.4), brushed); lug.position.set(xx, -1.05, s * 19.6 * k); lug.rotation.x = s * 0.28; body.add(lug); }
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[15.0, 2.45], [19.6, 2.5], [20.15, 3.15], [19.2, 3.7], [15.0, 3.75]], k), 128), metal.clone()); bz.material.side = THREE.DoubleSide; body.add(bz);
    const crystal = new THREE.Mesh(new THREE.SphereGeometry(42, 72, 24, 0, Math.PI * 2, 0, Math.asin(15.1 * k / 42)), M.crystal); crystal.position.y = 3.7 - 42; crystal.renderOrder = 5; body.add(crystal);
    alligator(body, -1.05, 21.2 * k + 4.2, watch.bracelet && watch.bracelet.dye);
    dims = { cbY: -4.85, yFront: 6.15, yBack: 3.6 };
  } else if (C.style === 'octagon') {
    const kk = C.r / 20;
    const prof = V2([[14.6, -4.2], [16.8, -4.2], [17.4, -2.2], [17.4, 1.5], [16.2, 2.35], [14.6, 2.35]], kk);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(14.6 * kk, 14.6 * kk, 6.2, 80, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -0.95; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.15, -2.6], [14.4 * kk, -2.6], [14.4 * kk, 0.1], [movR + 0.15, 0.1]]), 64), M.spacer); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    const oct = new THREE.Shape();
    const Rout = 19.3 * kk;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      const x = Math.cos(a) * Rout, y = Math.sin(a) * Rout;
      if (i === 0) oct.moveTo(x, y); else oct.lineTo(x, y);
    }
    oct.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, 14.7 * kk, 0, Math.PI * 2, true); oct.holes.push(hole);
    const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(oct, { depth: 1.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }).rotateX(-Math.PI / 2), metal.clone());
    bezel.position.y = 2.2; body.add(bezel);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.32, 12), brushed);
      sc.position.set(Math.cos(a) * 17.3 * kk, 3.4, Math.sin(a) * 17.3 * kk);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.1), M.darkSteel);
      slot.position.set(sc.position.x, sc.position.y + 0.18, sc.position.z);
      body.add(sc, slot);
    }
    const crystal = new THREE.Mesh(new THREE.CylinderGeometry(14.6 * kk, 14.6 * kk, 0.5, 64), M.crystal);
    crystal.position.y = 3.2; crystal.renderOrder = 5; body.add(crystal);
    bracelet(body, M, watch, kk, -1.5, 16.4 * kk + 4, 8);
    dims = { cbY: -4.35, yFront: 5.7, yBack: 3.35 };
  } else if (C.style === 'tank') {
    const gold = metal.clone();
    const rail = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gold); m.position.set(x, y, z); body.add(m); };
    // Marco, no una placa ciega: el calibre se ve al quitar el fondo. La abertura es el hueco interior de los costados.
    rail(4.4, 0.9, 22, -12.8, -3.35, 0);
    rail(4.4, 0.9, 22, 12.8, -3.35, 0);
    rail(21.2, 0.9, 3.8, 0, -3.35, -9.1);
    rail(21.2, 0.9, 3.8, 0, -3.35, 9.1);
    rail(3.6, 6.2, 22, -13.2, -0.15, 0);
    rail(3.6, 6.2, 22, 13.2, -0.15, 0);
    rail(22.8, 6.2, 3.1, 0, -0.15, -9.45);
    rail(22.8, 6.2, 3.1, 0, -0.15, 9.45);
    rail(26.4, 0.7, 2.3, 0, 3.2, -8.55);
    rail(26.4, 0.7, 2.3, 0, 3.2, 8.55);
    rail(2.4, 0.7, 14.8, -12.2, 3.2, 0);
    rail(2.4, 0.7, 14.8, 12.2, 3.2, 0);
    const crystal = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.28, 15.2), M.crystal); crystal.position.y = 3.55; crystal.renderOrder = 5; body.add(crystal);
    for (const s of [-1, 1]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 3.6), gold); lug.position.set(0, -1.1, s * 12.4); body.add(lug); }
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 1.7, 16).rotateZ(Math.PI / 2), gold); crown.position.set(16.2, 0.2, 0); body.add(crown);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0x1a3f86, roughness: 0.08, metalness: 0.15, clearcoat: 1 }));
    cab.position.set(17.15, 0.2, 0); body.add(cab);
    alligator(body, -1.3, 16.2, watch.bracelet && watch.bracelet.dye);
    // El dorso exterior del marco está en y = −3,8. El fondo se apoya justo por fuera, sin clavarse en el oro.
    dims = { cbY: -4.13, yFront: 4.4, yBack: 2.5 };
  } else if (C.style === 'pilot') {
    // Flieger. Ningún reloj de la casa usa esta caja. El hueco (15,2) admite ZR-28 y ZQ-11, no la esfera de 16,2.
    const prof = V2([[15.2, -4.0], [17.6, -4.0], [18.8, -3.0], [19.1, 0.2], [18.4, 1.55], [15.2, 1.55]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(15.2 * k, 15.2 * k, 5.4, 80, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -1.2; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.12, -2.7], [15.05 * k, -2.7], [15.05 * k, -0.05], [movR + 0.12, -0.05]]), 80), M.spacer); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[15.05, 1.5], [18.5, 1.55], [18.9, 2.15], [17.8, 2.7], [15.05, 2.75]], k), 96), brushed.clone()); bz.material.side = THREE.DoubleSide; body.add(bz);
    const tri = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.05, 3), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.4, roughness: 0.45 }));
    tri.rotation.x = -Math.PI / 2; tri.position.set(0, 2.95, -16.6 * k); body.add(tri);
    for (const s of [-1, 1]) for (const xx of [-6.2, 6.2]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.2, 7.2), brushed); lug.position.set(xx, -1.1, s * 18.6 * k); body.add(lug); }
    const crystal = new THREE.Mesh(new THREE.CylinderGeometry(15.0 * k, 15.0 * k, 0.55, 80), M.crystal); crystal.position.y = 2.35; crystal.renderOrder = 5; body.add(crystal);
    alligator(body, -1.2, 18.6 * k + 4.2, watch.bracelet && watch.bracelet.dye);
    dims = { cbY: -4.4, yFront: 5.15, yBack: 3.2 };
  } else {
    const prof = V2([[15.4, -3.0], [18.2, -3.0], [18.9, -2.2], [19.0, 0.2], [18.6, 1.3], [15.4, 1.3]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(15.4 * k, 15.4 * k, 4.3, 96, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -0.85; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.1, -2.6], [15.3 * k, -2.6], [15.3 * k, -0.1], [movR + 0.1, -0.1]]), 96), new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.7 })); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[15.2, 1.3], [18.6, 1.3], [18.5, 1.8], [17.6, 2.2], [15.2, 2.25]], k), 128), metal.clone()); bz.material.side = THREE.DoubleSide; body.add(bz);
    for (const s of [-1, 1]) for (const xx of [-7.6, 7.6]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 5.2), metal); lug.position.set(xx, -0.4, s * 19.4 * k); lug.rotation.x = s * 0.18; body.add(lug); }
    const crystal = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 8, 0, Math.PI * 2, 0, Math.asin(15.3 * k / 40)), M.crystal); crystal.position.y = 2.25 - 40; crystal.renderOrder = 5; body.add(crystal);
    // La Lira (y Build · Vestir) piden correa. bracelet() no conoce el aligátor y la pintaba de eslabones.
    if (watch.bracelet && watch.bracelet.style === 'alligator') alligator(body, -0.9, 19.4 * k + 3.6, watch.bracelet.dye);
    else bracelet(body, M, watch, k, -0.9, 19.4 * k + 3.6, 6.6);
    dims = { cbY: -3.3, yFront: 3.7, yBack: 2.35 };
  }
  // fondo
  const cb = tag(new THREE.Group(), 'caseback');
  const cbMat = new THREE.MeshPhysicalMaterial({ color: metal.color, metalness: 1, roughness: 0.32, map: TX.casebackTexture(C.backText, C.backMono), envMapIntensity: 0.95, clearcoat: 0.12, clearcoatRoughness: 0.35 });
  if (C.style === 'astral') {
    const kk = C.r / 20;
    cb.add(new THREE.Mesh(new THREE.TorusGeometry(14.2 * kk, 1.15, 12, 80).rotateX(Math.PI / 2), metal));
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(13.1 * kk, 13.1 * kk, 0.28, 64), M.crystal); glass.position.y = 0.05; cb.add(glass);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(16.2 * kk, 16.6 * kk, 0.7, 80), [metal, metal, cbMat]); cb.add(lip);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const n = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.9), M.darkSteel); n.position.set(Math.cos(a) * 15.6 * kk, -0.2, Math.sin(a) * 15.6 * kk); n.rotation.y = -a; cb.add(n); }
    cb.add(hitProxy(M, 16.4 * kk, 1.2));
  } else if (C.style === 'tank') {
    // La cara de fuera es −Y. Un BoxGeometry pide un material por cara; con tres, el dorso no se dibujaba.
    const plate = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.62, 15.4), [metal, metal, metal, cbMat, metal, metal]);
    cb.add(plate);
    const notch = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.15), M.darkSteel);
    notch.position.set(0, -0.28, 7.15);
    cb.add(notch);
    cb.add(boxHit(M, 22.4, 1.3, 15.4));
  } else if (C.caseback === 'screw') {
    cb.add(new THREE.Mesh(new THREE.CylinderGeometry(17.6 * k, 18.2 * k, 1.1, 96), [metal, metal, cbMat]));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const n = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.2), M.darkSteel); n.position.set(Math.cos(a) * 17.2 * k, -0.35, Math.sin(a) * 17.2 * k); n.rotation.y = -a; cb.add(n); }
    cb.add(hitProxy(M, 18.2 * k, 1.4));
  } else {
    cb.add(new THREE.Mesh(new THREE.CylinderGeometry(17.2 * k, 17.6 * k, 0.6, 96), [metal, metal, cbMat]));
    const lip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.8), M.darkSteel); lip.position.set(0, 0.0, 17.4 * k); cb.add(lip);
    cb.add(hitProxy(M, 17.6 * k, 1.0));
  }
  cb.position.y = dims.cbY;
  return { body, caseback: cb, dims };
}
function alligator(body, y, z0, dye) {
  const map = TX.gatorColor();
  const leather = dye
    ? new THREE.MeshPhysicalMaterial({ color: dye, roughness: 0.58, metalness: 0.04, bumpMap: map, bumpScale: 0.42, sheen: 0.55, sheenRoughness: 0.4, sheenColor: new THREE.Color(dye).multiplyScalar(0.45), clearcoat: 0.12, clearcoatRoughness: 0.55 })
    : new THREE.MeshPhysicalMaterial({ map, color: 0x6a5644, roughness: 0.7, metalness: 0.02, sheen: 0.4, sheenRoughness: 0.5 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x0c0b09, roughness: 0.8 });
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(15.5, 2.4, 46), leather);
    strap.position.set(0, y - 0.4, s * (z0 + 20));
    body.add(strap);
    const side = new THREE.Mesh(new THREE.BoxGeometry(16.3, 1.6, 46), edge);
    side.position.set(0, y - 0.9, s * (z0 + 20));
    body.add(side);
  }
}
function bracelet(body, M, watch, k, y, z0, w) {
  const B = watch.bracelet, pol = M.metal(B.metal), br = M.metal(B.metal, true);
  if (B.style === 'oyster') {
    const sG = new THREE.BoxGeometry(6.6, 3.0, 5.2), mG = new THREE.CylinderGeometry(1.6, 1.6, 7.6, 20).rotateZ(Math.PI / 2);
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const z = s * (z0 + i * 5.6), yy = y - i * i * 0.06;
      for (const xx of [-7.2, 7.2]) { const m = new THREE.Mesh(sG, br); m.position.set(xx, yy, z); body.add(m); }
      const mid = new THREE.Mesh(mG, pol); mid.position.set(0, yy + 0.3, z); mid.scale.set(1, 1, 1.6); body.add(mid);
    }
  } else { // multi-eslabón: 5 eslabones por fila, alternando pulido/satinado
    const G = new THREE.BoxGeometry(3.1, 1.6, 3.6);
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const z = s * (z0 + i * 3.9), yy = y - i * i * 0.03;
      for (let j = 0; j < 5; j++) { const m = new THREE.Mesh(G, (i + j) % 2 ? br : pol); m.position.set((j - 2) * 3.3, yy, z); body.add(m); }
    }
  }
}
