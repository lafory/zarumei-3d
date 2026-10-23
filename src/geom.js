// Helpers de geometría procedural (unidades: mm)
import * as THREE from 'three';
export function extrudeShape(shape, depth, bevel = 0.06, curve = 32) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: curve });
  g.rotateX(Math.PI / 2); g.translate(0, depth, 0); return g; // forma (x,y) → plano XZ, ocupa y ∈ [0, depth]
}
export function polyShape(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; }
export function gearShape(r, teeth, hole = 0.4, spokes = 0) {
  const s = new THREE.Shape(), h = Math.min(0.5, r * 0.12);
  for (let i = 0; i < teeth; i++) {
    const a = (k) => (i + k) / teeth * Math.PI * 2, pt = (rr, aa) => [Math.cos(aa) * rr, Math.sin(aa) * rr];
    const p0 = pt(r, a(0)), p1 = pt(r + h, a(0.25)), p2 = pt(r + h, a(0.5)), p3 = pt(r, a(0.75));
    if (i === 0) s.moveTo(...p0); else s.lineTo(...p0); s.lineTo(...p1); s.lineTo(...p2); s.lineTo(...p3);
  }
  s.closePath();
  if (hole) { const hp = new THREE.Path(); hp.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(hp); }
  if (spokes && r > 1.6) for (let k = 0; k < spokes; k++) {
    const a = k / spokes * Math.PI * 2, w = Math.PI * 2 / spokes * 0.62, r0 = r * 0.3, r1 = r * 0.78;
    const hp = new THREE.Path(); hp.absarc(0, 0, r1, a + 0.12, a + w, false); hp.absarc(0, 0, r0, a + w - 0.05, a + 0.2, true); hp.closePath(); s.holes.push(hp);
  }
  return s;
}
export function gearMesh(r, teeth, depth, mat, spokes = 4) { return new THREE.Mesh(extrudeShape(gearShape(r, teeth, 0.35, spokes), depth, Math.min(0.04, depth * 0.22), 14), mat); }
export function ringShape(r0, r1, a0 = 0, a1 = Math.PI * 2) { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; }
export function hitProxy(M, r, h, y = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), M.hit); m.position.y = y; m.userData.isHit = true; return m; }
export function boxHit(M, w, h, d) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.hit); m.userData.isHit = true; return m; }
export function tag(obj, partId) { obj.userData.partId = partId; obj.name = partId; return obj; }
export function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
export function cyl(r, h, mat, seg = 24, y = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.y = y + h / 2; return m; }
export function jewelMesh(M, r = 0.45) {
  const g = new THREE.Group();
  const chaton = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.25, 0.08, 20), M.goldChaton); chaton.position.y = 0.04; g.add(chaton);
  const j = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.14, 20), M.ruby); j.position.y = 0.11; g.add(j);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.18, 0.16, 8), M.darkSteel); hole.position.y = 0.12; g.add(hole);
  return g;
}
export function shadowAll(o) { o.traverse(m => { if (m.isMesh && !m.userData.isHit && m.material && !m.material.transparent) { m.castShadow = true; m.receiveShadow = true; } }); }
// Tornillo de relojero: cabeza abombada azulada con ranura; d = punta (mm) → Ø cabeza ≈ 1,7 × punta
const screwGeo = {};
export function screwMesh(M, size, ghost = false) {
  const r = size * 0.62, key = size.toFixed(2);
  if (!screwGeo[key]) screwGeo[key] = {
    head: new THREE.CylinderGeometry(r * 0.9, r, 0.32, 20).translate(0, 0.16, 0),
    dome: new THREE.SphereGeometry(r * 0.9, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.25, 1).translate(0, 0.32, 0),
    slot: new THREE.BoxGeometry(r * 1.95, 0.16, size * 0.18).translate(0, 0.38, 0),
    thread: new THREE.CylinderGeometry(r * 0.45, r * 0.4, 1.0, 10).translate(0, -0.5, 0)
  };
  const G = screwGeo[key], g = new THREE.Group();
  const mat = ghost ? M.ghost : M.blueScrew;
  g.add(new THREE.Mesh(G.head, mat)); g.add(new THREE.Mesh(G.dome, mat));
  if (!ghost) { g.add(new THREE.Mesh(G.slot, M.darkSteel)); const th = new THREE.Mesh(G.thread, M.steel); th.visible = false; th.name = 'thread'; g.add(th); }
  g.traverse(o => { if (o.geometry) o.geometry.userData.shared = true; });
  return g;
}
