// Esfera + agujas (comunes a todos los calibres). Coordenadas del grupo dialSide = las del reloj:
// +Y hacia el cristal, 12h = −Z, 3h = +X.
import * as THREE from 'three';
import * as TX from './textures.js';
import { tag, at, hitProxy, cyl } from './geom.js';
import { vaticanNow } from './vatican.js';

function handShape(style, len, w) {
  const s = new THREE.Shape();
  if (style === 'sword') { s.moveTo(-w * 0.55, -2); s.lineTo(-w / 2, len * 0.8); s.lineTo(0, len); s.lineTo(w / 2, len * 0.8); s.lineTo(w * 0.55, -2); }
  else if (style === 'baton') { s.moveTo(-w / 2, -2.4); s.lineTo(-w / 2, len * 0.9); s.lineTo(0, len); s.lineTo(w / 2, len * 0.9); s.lineTo(w / 2, -2.4); }
  else if (style === 'dauphine') { s.moveTo(0, -1.7); s.lineTo(-w * 0.22, -0.6); s.lineTo(-w * 0.95, len * 0.62); s.lineTo(0, len); s.lineTo(w * 0.95, len * 0.62); s.lineTo(w * 0.22, -0.6); }
  else if (style === 'arrow') { s.moveTo(-w * 0.2, -2); s.lineTo(-w * 0.2, len * 0.7); s.lineTo(-w * 0.85, len * 0.7); s.lineTo(0, len); s.lineTo(w * 0.85, len * 0.7); s.lineTo(w * 0.2, len * 0.7); s.lineTo(w * 0.2, -2); }
  else { s.moveTo(0, -1.6); s.quadraticCurveTo(-w * 0.75, len * 0.45, 0, len); s.quadraticCurveTo(w * 0.75, len * 0.45, 0, -1.6); } // hoja (leaf)
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g;
}
// feet: { r, bottom, a: [ángulos] } → pies de esfera que entran en la platina (los aprietan los tornillos de pie)
export function buildDial(M, images, watch, ys, feet = { r: 10.8, bottom: ys.dial - 1.5, a: [0.785, 3.927] }) {
  const { r, kind, date } = watch.dial; const metal = M.metal(watch.hands.metal);
  const dial = tag(new THREE.Group(), 'dial');
  if (kind === 'recta') {
    const faceY = ys.dial + 1.45; // la pila del ZR-28 subió 0,4 mm: la placa Recta queda a la misma altura bajo el cristal
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(22.0, 15.05).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.4, metalness: 0.02 }));
    apron.position.y = faceY - 0.55; dial.add(apron);
    const v = vaticanNow();
    const years = [];
    for (let y = v.year - 1; y < v.year + 11; y++) years.push(String(y));
    const discMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0.02 });
    const placeDisc = (words, wx, wz, scale) => {
      const g = new THREE.Group();
      const r = 1.55;
      g.add(new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), discMat(TX.calendarDiscTexture(words, '#f7f1e4', scale))));
      g.position.set(wx, faceY - 0.16, wz + r * 0.55);
      dial.add(g);
      return g;
    };
    const [mx, mz] = TX.rectaWorld(TX.RECTA_DIAL.S / 2, TX.RECTA_DIAL.S / 2 - (4.55 / TX.RECTA_DIAL.H) * TX.RECTA_DIAL.S);
    const moonTex = TX.moonFaceTexture();
    moonTex.userData.paint(v.phase);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(1.08, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.42 }));
    moon.position.set(mx, faceY - 0.12, mz); dial.add(moon);
    const moonRing = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.07, 8, 36).rotateX(Math.PI / 2), metal);
    moonRing.position.set(mx, faceY + 0.05, mz); dial.add(moonRing);
    const day = placeDisc(['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], -4.15, 2.05, 0.13);
    const month = placeDisc(['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'], 0, 2.05, 0.13);
    const year = placeDisc(years, 4.15, 2.05, 0.095);
    const frame = (w, h, x, z) => {
      const t = 0.07, y = faceY + 0.05;
      for (const s of [-1, 1]) {
        const hz = new THREE.Mesh(new THREE.BoxGeometry(w + t, 0.05, t), metal); hz.position.set(x, y, z + s * h / 2); dial.add(hz);
        const vt = new THREE.Mesh(new THREE.BoxGeometry(t, 0.05, h), metal); vt.position.set(x + s * w / 2, y, z); dial.add(vt);
      }
    };
    frame(1.96, 1.00, -4.15, 2.05);
    frame(1.96, 1.00, 0, 2.05);
    frame(2.44, 1.00, 4.15, 2.05);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(21.6, 14.8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.dialTexture('recta', images, 1), transparent: true, alphaTest: 0.4, roughness: 0.32, metalness: 0.02 }));
    face.position.y = faceY; face.renderOrder = 2; dial.add(face);
    dial.add(hitProxy(M, 10, 0.4, faceY));
    dial.userData.recta = { moonTex, day, month, year, yearN: years.length, gmt: null }; dial.userData.rectaFaceY = faceY + 0.02;
    day.rotation.y = (v.dow / 7) * Math.PI * 2;
    month.rotation.y = (v.month / 12) * Math.PI * 2;
    year.rotation.y = (1 / years.length) * Math.PI * 2;
    return dial;
  }
  if (watch.grand) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(r, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.dialTexture(kind, images, 1, { grand: watch.grand }), transparent: true, alphaTest: 0.45, roughness: kind === 'espina' ? 0.28 : 0.48, metalness: kind === 'espina' ? 0.35 : 0.04 }));
    face.position.y = ys.dial; face.renderOrder = 1; dial.add(face);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.28, 80, 1, true), M.darkSteel); edge.position.y = ys.dial - 0.14; dial.add(edge);
    dial.add(hitProxy(M, r, 0.5, ys.dial));
    return dial;
  }
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 128).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TX.dialTexture(kind, images, new Date().getDate(), { date: !!date }), roughness: kind === 'rose' || kind === 'lira' ? 0.25 : kind === 'octava' ? 0.35 : 0.5, metalness: kind === 'octava' ? 0.08 : 0 }));
  face.position.y = ys.dial; face.renderOrder = 1; dial.add(face);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 96, 1, true), M.darkSteel); edge.position.y = ys.dial - 0.15; dial.add(edge);
  const under = new THREE.Mesh(new THREE.CircleGeometry(r, 64).rotateX(Math.PI / 2), M.brassDial || M.darkSteel); under.position.y = ys.dial - 0.3; dial.add(under);
  { const top = ys.dial - 0.3, len = top - feet.bottom; for (const a of feet.a) { const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, len, 8), M.goldWheel); foot.position.set(Math.cos(a) * feet.r, top - len / 2, Math.sin(a) * feet.r); dial.add(foot); } }
  const idx = (kind === 'rose' || kind === 'lira' || kind === 'octava') ? 'baton' : kind;
  const ri = r * 0.815, y = ys.dial + 0.22;
  for (let h = 1; h <= 12; h++) {
    if (h === 3 && date) continue;
    const a = h * Math.PI / 6, x = Math.sin(a) * ri, z = -Math.cos(a) * ri;
    const put = (m, rx = 0) => { m.position.set(x, y, z); m.rotation.y = -a; dial.add(m); };
    if (idx === 'baton') {
      const len = h === 12 ? 2.6 : 2.4;
      if (h === 12) for (const dx of [-0.55, 0.55]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, len), metal); b.position.set(dx, y, -ri); dial.add(b); }
      else put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, len), metal));
    } else if (h === 12) {
      if (kind === 'miami') for (const dx of [-0.7, 0.7]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 2.3), metal); b.position.set(dx, y, -r * 0.84); dial.add(b); const l = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.48, 1.7), M.lume); l.position.set(dx, y + 0.01, -r * 0.84); dial.add(l); }
      else { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.45, 3), metal); t.rotation.y = Math.PI / 2; t.position.set(0, y, -ri); t.scale.z = 1.3; dial.add(t); const l = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 3), M.lume); l.rotation.y = Math.PI / 2; l.position.set(0, y + 0.03, -ri); l.scale.z = 1.3; dial.add(l); }
    } else if (h % 3 === 0) { put(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 3.0), metal)); const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 2.3), M.lume); put(l); }
    else { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.45, 20), metal); d.position.set(x, y, z); dial.add(d); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.48, 16), M.lume); l.position.set(x, y + 0.02, z); dial.add(l); }
  }
  dial.add(hitProxy(M, r, 0.6, ys.dial));
  return dial;
}
export function buildHands(M, watch, ys) {
  const st = watch.hands.style, metal = M.metal(watch.hands.metal), r = watch.dial.kind === 'recta' ? 11.2 : watch.dial.r, lume = st !== 'leaf' && st !== 'dauphine';
  const lift = watch.dial.kind === 'recta' ? 1.45 : 0;
  const hw = st === 'leaf' || st === 'dauphine' ? 1.15 : st === 'arrow' ? 1.35 : 1.5;
  const mk = (id, len, w, y) => {
    const g = tag(new THREE.Group(), id); const inner = new THREE.Group(); inner.name = 'rot'; g.add(inner);
    inner.add(new THREE.Mesh(handShape(st, len, w), metal));
    if (lume) { const l = new THREE.Mesh(handShape(st, len * 0.8, w * 0.45), M.lume); l.position.y = 0.05; inner.add(l); }
    inner.add(at(cyl(0.6, 0.14, metal, 16), 0, 0, 0));
    const hp = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.6, len), M.hit); hp.userData.isHit = true; hp.position.set(0, 0, -len / 2); inner.add(hp);
    g.position.y = y + lift; return g;
  };
  const hour = mk('hourHand', r * 0.53, hw, ys.hour);
  const min = mk('minHand', r * 0.79, st === 'leaf' || st === 'dauphine' ? 0.9 : 1.1, ys.min);
  const sec = tag(new THREE.Group(), 'secHand'); { const inner = new THREE.Group(); inner.name = 'rot'; sec.add(inner);
    const col = watch.dial.kind === 'cuba' ? new THREE.MeshStandardMaterial({ color: 0xe0312a, metalness: 0.4, roughness: 0.35 }) : metal;
    inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, r * 1.05).translate(0, 0, -r * 0.33), col));
    if (lume) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 20), M.lume); c.position.z = -r * 0.62; inner.add(c); }
    inner.add(cyl(0.5, 0.14, col, 16)); const hp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, r), M.hit); hp.userData.isHit = true; hp.position.z = -r * 0.3; inner.add(hp);
    sec.position.y = ys.sec + lift; }
  if (watch.dial.kind === 'recta') {
    const gmt = new THREE.Group();
    const inner = new THREE.Group(); inner.name = 'rot'; gmt.add(inner);
    const steel = new THREE.MeshStandardMaterial({ color: 0xd5dbe3, metalness: 0.85, roughness: 0.22 });
    const len = r * 0.66;
    inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, len).translate(0, 0, -len * 0.36), steel));
    inner.add(at(cyl(0.34, 0.06, steel, 14), 0, 0, 0));
    gmt.position.y = 0.12;
    hour.add(gmt);
    return { hour, min, sec, gmt };
  }
  return { hour, min, sec };
}
