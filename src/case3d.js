// Cajas procedurales: 'diver' (oro o acero, fondo roscado, bisel giratorio) y 'slim' (oro rosa, fondo a presión).
import * as THREE from 'three';
import * as TX from './textures.js';
import { tag, hitProxy } from './geom.js';
const V2 = (pts, k = 1) => pts.map(([r, y]) => new THREE.Vector2(r * k, y));

export function buildCase(M, watch, movR) {
  const C = watch.case, body = new THREE.Group(), metal = M.metal(C.metal), brushed = M.metal(C.metal, true);
  const k = C.r / 20;
  let dims;
  if (C.style === 'diver') {
    const prof = V2([[16.3, -5.5], [18.6, -5.5], [19.6, -4.5], [20.0, -2.2], [20.0, 1.2], [19.4, 2.2], [16.3, 2.2]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(16.3 * k, 16.3 * k, 7.7, 96, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -1.65; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.1, -3.4], [16.2 * k, -3.4], [16.2 * k, -0.15], [movR + 0.1, -0.15]]), 96), M.spacer); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    for (const s of [-1, 1]) for (const xx of [-8.6, 8.6]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 10), metal); lug.position.set(xx, -1.4, s * 21.5 * k); body.add(lug); }
    if (C.crownGuards) for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.4, 2.6), metal); sh.position.set(20.6 * k, -0.9, s * 4.6); body.add(sh); }
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[16.0, 2.2], [19.6, 2.2], [19.9, 2.8], [19.4, 3.6], [16.0, 3.7]], k), 128), metal); bz.material = metal.clone(); bz.material.side = THREE.DoubleSide; body.add(bz);
    const topMat = C.bezel === 'ceramicBlue'
      ? new THREE.MeshPhysicalMaterial({ map: TX.ceramicBezelTexture(), roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 })
      : new THREE.MeshStandardMaterial({ color: metal.color, metalness: 1, roughness: 0.25, map: TX.bezelTexture() });
    const R1 = 19.3 * k, top = new THREE.Mesh(new THREE.RingGeometry(16.1 * k, R1, 128, 1).rotateX(-Math.PI / 2), topMat); top.position.y = 3.72; body.add(top);
    { const uv = top.geometry.attributes.uv, pos = top.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (2 * R1) + 0.5, -pos.getZ(i) / (2 * R1) + 0.5); }
    const nG = new THREE.BoxGeometry(0.3, 0.6, 0.5); for (let i = 0; i < 120; i++) { const n = new THREE.Mesh(nG, brushed); const a = i / 120 * Math.PI * 2; n.position.set(Math.cos(a) * 19.85 * k, 2.9, Math.sin(a) * 19.85 * k); n.rotation.y = -a; body.add(n); }
    const crystal = new THREE.Mesh(new THREE.CylinderGeometry(16.1 * k, 16.1 * k, 0.8, 96), M.crystal); crystal.position.y = 3.3; crystal.renderOrder = 5; body.add(crystal);
    bracelet(body, M, watch, k, -2.2, 21.5 * k + 5.6, 7.6);
    dims = { cbY: -5.95, yFront: 6.55, yBack: 3.8 };
  } else {
    const prof = V2([[15.4, -3.0], [18.2, -3.0], [18.9, -2.2], [19.0, 0.2], [18.6, 1.3], [15.4, 1.3]], k);
    const cm = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), metal.clone()); cm.material.side = THREE.DoubleSide; body.add(cm);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(15.4 * k, 15.4 * k, 4.3, 96, 1, true), brushed.clone()); inner.material.side = THREE.BackSide; inner.position.y = -0.85; body.add(inner);
    const spacer = new THREE.Mesh(new THREE.LatheGeometry(V2([[movR + 0.1, -2.6], [15.3 * k, -2.6], [15.3 * k, -0.1], [movR + 0.1, -0.1]]), 96), new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.7 })); spacer.material.side = THREE.DoubleSide; body.add(spacer);
    const bz = new THREE.Mesh(new THREE.LatheGeometry(V2([[15.2, 1.3], [18.6, 1.3], [18.5, 1.8], [17.6, 2.2], [15.2, 2.25]], k), 128), metal.clone()); bz.material.side = THREE.DoubleSide; body.add(bz);
    for (const s of [-1, 1]) for (const xx of [-7.6, 7.6]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 5.2), metal); lug.position.set(xx, -0.4, s * 19.4 * k); lug.rotation.x = s * 0.18; body.add(lug); }
    const crystal = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 8, 0, Math.PI * 2, 0, Math.asin(15.3 * k / 40)), M.crystal); crystal.position.y = 2.25 - 40; crystal.renderOrder = 5; body.add(crystal);
    bracelet(body, M, watch, k, -0.9, 19.4 * k + 3.6, 6.6);
    dims = { cbY: -3.3, yFront: 3.7, yBack: 2.35 };
  }
  // fondo
  const cb = tag(new THREE.Group(), 'caseback');
  const cbMat = new THREE.MeshStandardMaterial({ color: metal.color, metalness: 1, roughness: 0.28, map: TX.casebackTexture(C.backText, C.backMono) });
  if (C.caseback === 'screw') {
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
