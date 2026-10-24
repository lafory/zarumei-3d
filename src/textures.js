// Texturas procedurales en canvas (esfera, bisel, fondo, côtes de Genève, perlage, pantallas)
import * as THREE from 'three';
import { IMG } from './assets-inline.js';

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
export async function loadAllImages() {
  const out = {};
  for (const k of Object.keys(IMG)) out[k] = await loadImage(IMG[k]);
  return out;
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function tex(c, { srgb = true, flipY = true, repeat } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flipY; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.needsUpdate = true; return t;
}
const P = (r, deg) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];

// ESFERAS (canvas 1024 px). 12 ARRIBA. kind: miami | cuba | rose
function minuteTrack(x, R, col, r0 = 0.995, r1 = 0.95, r2 = 0.93) {
  for (let i = 0; i < 60; i++) {
    const [x1, y1] = P(R * r0, i * 6), [x2, y2] = P(i % 5 ? R * r1 : R * r2, i * 6);
    x.strokeStyle = col; x.lineWidth = i % 5 ? 2 : 5; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }
}
function dateWindow(x, R, day, frame = '#b8862b') {
  x.fillStyle = '#fffdf6'; x.strokeStyle = frame; x.lineWidth = 8;
  x.fillRect(R * 0.66, -R * 0.085, R * 0.2, R * 0.17); x.strokeRect(R * 0.66, -R * 0.085, R * 0.2, R * 0.17);
  x.fillStyle = '#111'; x.font = `bold ${R * 0.13}px Helvetica, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(day), R * 0.76, R * 0.005);
}
function punch(x, cx, cy, w, h, round) {
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = '#000';
  if (round) { x.beginPath(); x.arc(cx, cy, w, 0, Math.PI * 2); x.fill(); }
  else x.fillRect(cx - w / 2, cy - h / 2, w, h);
  x.restore();
  x.strokeStyle = 'rgba(212,175,90,.9)'; x.lineWidth = 5;
  if (round) { x.beginPath(); x.arc(cx, cy, w, 0, Math.PI * 2); x.stroke(); }
  else x.strokeRect(cx - w / 2, cy - h / 2, w, h);
}
const ART = { fiesta: '#4a1020', cosmos: '#120818', hoja: '#0c0c0e', marte: '#2a140e', mascara: '#101012', cuerno: '#0c0c0e', onelove: '#101012' };
function artDial(x, R, kind, images, opt) {
  x.fillStyle = ART[kind]; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  const artR = R * 0.64;
  const img = images[kind];
  x.save(); x.beginPath(); x.arc(0, 0, artR, 0, Math.PI * 2); x.clip();
  x.drawImage(img, -artR, -artR, artR * 2, artR * 2); x.restore();
  x.strokeStyle = kind === 'cosmos' ? 'rgba(255,255,255,.75)' : '#e6c36a';
  x.lineWidth = R * 0.012; x.beginPath(); x.arc(0, 0, artR + R * 0.008, 0, Math.PI * 2); x.stroke();
  minuteTrack(x, R, kind === 'mascara' ? '#f4f4f4' : '#f2efe6', 0.975, 0.935, 0.905);
  if (!opt || !opt.rim) return;
  const mm = (mx, mz) => [mx / 16.2 * R, mz / 16.2 * R];
  const day = mm(-12.6, -1.4), month = mm(12.6, -1.4);
  punch(x, day[0], day[1], R * 0.18, R * 0.085, false);
  punch(x, month[0], month[1], R * 0.2, R * 0.085, false);
  x.fillStyle = 'rgba(246,215,138,.92)'; x.font = `600 ${R * 0.026}px Helvetica, Arial`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('DÍA', day[0], day[1] - R * 0.07);
  x.fillText('MES', month[0], month[1] - R * 0.07);
  const six = mm(0, 12.6);
  x.strokeStyle = 'rgba(246,215,138,.9)'; x.lineWidth = 4;
  if (opt.compass) {
    x.beginPath(); x.arc(six[0], six[1], R * 0.11, 0, Math.PI * 2); x.stroke();
    x.fillText('N', six[0], six[1]);
  } else if (opt.moon) {
    punch(x, six[0], six[1], R * 0.12, 0, true);
    x.fillText('LUNA', six[0], six[1] - R * 0.16);
  } else {
    const depth = mm(0, 13.2);
    x.beginPath(); x.arc(depth[0], depth[1], R * 0.085, 0, Math.PI * 2); x.stroke();
    x.fillText('PROF.', depth[0], depth[1] - R * 0.13);
  }
}
function grandDial(x, R, kind) {
  const compass = kind !== 'diablo';
  const g = x.createRadialGradient(-R * 0.2, -R * 0.3, R * 0.05, 0, 0, R);
  if (kind === 'diablo') { g.addColorStop(0, '#7a1020'); g.addColorStop(0.55, '#4a0814'); g.addColorStop(1, '#1a0408'); }
  else if (kind === 'espina') { g.addColorStop(0, '#8fd4ff'); g.addColorStop(0.35, '#5a4ad4'); g.addColorStop(0.7, '#c45a18'); g.addColorStop(1, '#1a120c'); }
  else if (kind === 'ala') { g.addColorStop(0, '#ff4fa8'); g.addColorStop(0.5, '#9a1468'); g.addColorStop(1, '#2a0818'); }
  else { g.addColorStop(0, '#1e8f62'); g.addColorStop(0.45, '#0c3d32'); g.addColorStop(1, '#070d0c'); }
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  minuteTrack(x, R, kind === 'ala' ? '#f6d78a' : '#f2efe6', 0.97, 0.93, 0.9);
  if (kind === 'ala' || kind === 'orbital') {
    x.fillStyle = 'rgba(246,215,138,.85)'; x.font = `600 ${R * 0.045}px Georgia, serif`; x.textAlign = 'center';
    for (let h = 1; h <= 24; h++) {
      const a = h / 24 * Math.PI * 2 - Math.PI / 2;
      x.fillText(String(h), Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78);
    }
  }
  x.fillStyle = 'rgba(255,255,255,.75)'; x.font = `600 ${R * 0.04}px Georgia, serif`; x.textAlign = 'center';
  x.fillText(kind === 'diablo' ? 'DIABLO · 100 M' : kind === 'espina' ? 'ESPINA · BRÚJULA' : kind === 'ala' ? 'ALA · 24 H' : 'ORBITAL · LUNA', 0, R * 0.22);
  const day = compass ? [-R * 0.41, -R * 0.21] : [0, -R * 0.56];
  const month = compass ? [R * 0.41, -R * 0.21] : [0, -R * 0.40];
  punch(x, day[0], day[1], R * 0.22, R * 0.1, false);
  punch(x, month[0], month[1], R * 0.24, R * 0.1, false);
  if (kind === 'orbital') punch(x, 0, R * 0.47, R * 0.16, 0, true);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.font = `500 ${R * 0.032}px Helvetica, Arial`;
  x.fillText('DÍA', day[0], day[1] - R * 0.09);
  x.fillText('MES', month[0], month[1] - R * 0.09);
  if (compass) { x.strokeStyle = 'rgba(246,215,138,.7)'; x.beginPath(); x.arc(0, -R * 0.52, R * 0.13, 0, 7); x.stroke(); x.fillText('N', 0, -R * 0.52); }
  const depth = kind === 'orbital' ? [R * 0.35, R * 0.32] : [0, R * 0.48];
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.arc(depth[0], depth[1], R * 0.11, 0, 7); x.stroke();
  x.fillText('PROF.', depth[0], depth[1] + R * 0.16);
}
export function calendarDiscTexture(words, color = '#f6f1e6') {
  const S = 512, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  x.fillStyle = color; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#1c140c'; x.font = `bold ${R * 0.18}px Helvetica, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  words.forEach((w, i) => { x.save(); x.rotate(i / words.length * Math.PI * 2); x.fillText(w, 0, -R * 0.55); x.restore(); });
  return tex(c);
}
export function moonDiscTexture() {
  const S = 512, c = canvas(S), x = c.getContext('2d');
  x.fillStyle = '#071428'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { x.fillStyle = '#fff'; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
  for (const cx of [S * 0.28, S * 0.72]) {
    x.fillStyle = '#f4e2a8'; x.beginPath(); x.arc(cx, S / 2, S * 0.16, 0, 7); x.fill();
    x.fillStyle = '#071428'; x.beginPath(); x.arc(cx + S * 0.08, S / 2 - S * 0.02, S * 0.13, 0, 7); x.fill();
  }
  return tex(c);
}
const ATELIER = {
  verde: { stops: [[0, '#3dba6a'], [0.55, '#146b38'], [1, '#062014']], mark: '#f3e2b0', ink: '#f6f1e2', track: '#f3e6c4' },
  negro: { stops: [[0, '#3a3a3e'], [0.5, '#141416'], [1, '#050506']], mark: '#e6c36a', ink: '#f4efe2', track: '#e6c36a' },
  coral: { stops: [[0, '#f0a090'], [0.5, '#b85a48'], [1, '#3a1612']], mark: '#fff6ee', ink: '#fff6ee', track: '#fff6ee' },
  humo: { stops: [[0, '#e7edf2'], [0.45, '#8b97a3'], [1, '#1c242c']], mark: '#1a1c1e', ink: '#1a1c1e', track: '#1a1c1e' }
};
function atelierFace(x, R, kind, date, day, brand = true) {
  const A = ATELIER[kind];
  const g = x.createRadialGradient(-R * 0.18, -R * 0.22, R * 0.05, 0, 0, R);
  for (const [t, col] of A.stops) g.addColorStop(t, col);
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 240; i++) {
    x.strokeStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, 0); const [px, py] = P(R, i * 1.5); x.lineTo(px, py); x.stroke();
  }
  minuteTrack(x, R, A.track, 0.985, 0.95, 0.925);
  if (date) dateWindow(x, R, day, A.mark);
  if (!brand) return;
  x.textAlign = 'center'; x.fillStyle = A.ink; x.font = `600 ${R * 0.07}px Georgia, serif`;
  x.fillText('ZARUMEI', 0, -R * 0.42);
  x.fillStyle = A.mark; x.font = `500 ${R * 0.032}px Helvetica, Arial`;
  x.fillText('ATELIER', 0, R * 0.5);
}
function atelierGrand(x, R, kind, opt) {
  const A = ATELIER[kind];
  atelierFace(x, R, kind, false, 1, false);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opt.military) {
    x.fillStyle = A.mark; x.font = `600 ${R * 0.04}px Georgia, serif`;
    for (let h = 1; h <= 24; h++) {
      const a = h / 24 * Math.PI * 2 - Math.PI / 2;
      x.fillText(String(h), Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78);
    }
  }
  const mm = (mx, mz) => [mx / 16.2 * R, mz / 16.2 * R];
  const compass = !!opt.compass;
  const day = compass ? mm(-6.6, -3.4) : mm(0, -9.1);
  const month = compass ? mm(6.6, -3.4) : mm(0, -6.5);
  punch(x, day[0], day[1], R * 0.22, R * 0.1, false);
  punch(x, month[0], month[1], R * 0.24, R * 0.1, false);
  if (opt.moon) { const p = mm(0, 7.6); punch(x, p[0], p[1], R * 0.16, 0, true); }
  x.fillStyle = A.mark; x.font = `500 ${R * 0.03}px Helvetica, Arial`;
  x.fillText('DÍA', day[0], day[1] - R * 0.09);
  x.fillText('MES', month[0], month[1] - R * 0.09);
  if (compass) {
    const p = mm(0, -8.4);
    x.strokeStyle = A.mark; x.lineWidth = 4; x.beginPath(); x.arc(p[0], p[1], R * 0.13, 0, Math.PI * 2); x.stroke();
    x.fillText('N', p[0], p[1]);
  }
  const depth = opt.moon ? mm(5.6, 5.2) : mm(0, 7.7);
  x.strokeStyle = A.mark; x.lineWidth = 4; x.beginPath(); x.arc(depth[0], depth[1], R * 0.11, 0, Math.PI * 2); x.stroke();
  x.fillStyle = A.ink; x.fillText('PROF.', depth[0], depth[1] + R * 0.16);
  x.textBaseline = 'alphabetic';
}
export function dialTexture(kind, images, day, opts = {}) {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  if (kind === 'miami') {
    x.fillStyle = '#0b0b0b'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    x.save(); x.beginPath(); x.arc(0, 0, R * 0.93, 0, Math.PI * 2); x.clip();
    const k = 1.08; x.drawImage(images.dial, -R * k, -R * k, 2 * R * k, 2 * R * k); x.restore();
    const g = x.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#fff0b8'); g.addColorStop(.5, '#d9a945'); g.addColorStop(1, '#8a5f17');
    x.lineWidth = R * 0.075; x.strokeStyle = g; x.beginPath(); x.arc(0, 0, R * 0.965, 0, Math.PI * 2); x.stroke();
    minuteTrack(x, R, '#4a3108'); dateWindow(x, R, day);
    x.font = `bold ${R * 0.05}px Helvetica, Arial`; x.lineWidth = 6; x.strokeStyle = '#000'; x.fillStyle = '#fff'; x.textAlign = 'center';
    x.strokeText('AUTOMATIC · 100 M', 0, R * 0.55); x.fillText('AUTOMATIC · 100 M', 0, R * 0.55);
  } else if (kind === 'cuba') {
    // azul "sunburst": degradado radial + rayos finos
    const g = x.createRadialGradient(0, 0, R * 0.05, 0, 0, R); g.addColorStop(0, '#2f6fd6'); g.addColorStop(0.6, '#173f97'); g.addColorStop(1, '#0a1f55');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 360; i++) { x.strokeStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); const [px, py] = P(R, i); x.lineTo(px, py); x.stroke(); }
    x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 24; const b = images.cubaBear, h = R * 1.02, w = h * b.width / b.height; x.drawImage(b, -w / 2, -h * 0.47, w, h); x.restore();
    minuteTrack(x, R, '#e8eef8', 0.995, 0.955, 0.935); dateWindow(x, R, day, '#c9d3e3');
    x.textAlign = 'center'; x.fillStyle = '#ffffff'; x.font = `900 ${R * 0.075}px Helvetica, Arial`; x.fillText('ZARUMEI', 0, -R * 0.6);
    x.font = `bold ${R * 0.04}px Helvetica, Arial`; x.fillStyle = '#ff5a4f'; x.fillText('CUBA AZUL · 200 M', 0, R * 0.63);
  } else if (kind === 'ancla') {
    const g = x.createRadialGradient(0, -R * 0.1, R * 0.04, 0, 0, R); g.addColorStop(0, '#1e568f'); g.addColorStop(0.55, '#0c2c52'); g.addColorStop(1, '#061422');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 280; i++) { x.strokeStyle = i % 2 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.05)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); const [px, py] = P(R, i * (360 / 280)); x.lineTo(px, py); x.stroke(); }
    x.strokeStyle = '#e8c878'; x.fillStyle = '#e8c878'; x.lineWidth = R * 0.012; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, -R * 0.28); x.lineTo(0, R * 0.22); x.stroke();
    x.beginPath(); x.moveTo(-R * 0.09, -R * 0.2); x.lineTo(R * 0.09, -R * 0.2); x.lineTo(0, -R * 0.32); x.closePath(); x.fill();
    x.beginPath(); x.arc(-R * 0.07, R * 0.16, R * 0.09, 0.4, Math.PI - 0.2); x.stroke();
    x.beginPath(); x.arc(R * 0.07, R * 0.16, R * 0.09, 0.2, Math.PI - 0.4); x.stroke();
    minuteTrack(x, R, '#f3e6c4'); dateWindow(x, R, day, '#e6c36a');
    x.textAlign = 'center'; x.fillStyle = '#f6ead0'; x.font = `600 ${R * 0.07}px Georgia, serif`; x.fillText('ZARUMEI', 0, -R * 0.52);
    x.font = `600 ${R * 0.034}px Helvetica, Arial`; x.fillStyle = '#d7e6f6'; x.fillText('ANCLA · 100 M', 0, R * 0.6);
  } else if (kind === 'octava') {
    const g = x.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.04, 0, 0, R); g.addColorStop(0, '#2a62a4'); g.addColorStop(1, '#071018');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    x.save(); x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.clip();
    for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
      const cx = i * R * 0.105, cy = j * R * 0.105;
      const gg = x.createRadialGradient(cx - 8, cy - 8, 1, cx, cy, R * 0.05);
      gg.addColorStop(0, 'rgba(255,255,255,.22)'); gg.addColorStop(1, 'rgba(0,0,0,.28)');
      x.fillStyle = gg; x.beginPath(); x.moveTo(cx, cy - R * 0.042); x.lineTo(cx + R * 0.042, cy); x.lineTo(cx, cy + R * 0.042); x.lineTo(cx - R * 0.042, cy); x.closePath(); x.fill();
    }
    x.restore();
    minuteTrack(x, R, '#e7eef8', 0.99, 0.955, 0.94); dateWindow(x, R, day, '#c5d4ea');
    x.textAlign = 'center'; x.fillStyle = '#f3e7c4'; x.font = `600 ${R * 0.055}px Georgia, serif`; x.fillText('ZARUMEI', 0, -R * 0.38);
    x.font = `500 ${R * 0.03}px Helvetica, Arial`; x.fillStyle = '#d5e2f2'; x.fillText('AUTOMATIC', 0, R * 0.48);
  } else if (kind === 'lira') {
    const g = x.createRadialGradient(-R * 0.15, -R * 0.2, R * 0.05, 0, 0, R); g.addColorStop(0, '#fbf6ec'); g.addColorStop(1, '#e6d3b0');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#8d6b3c'; x.lineWidth = 2;
    x.beginPath(); x.arc(0, 0, R * 0.97, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 60; i++) { const [x1, y1] = P(R * 0.955, i * 6), [x2, y2] = P(R * (i % 5 ? 0.93 : 0.905), i * 6); x.lineWidth = i % 5 ? 1.4 : 3; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
    x.fillStyle = '#6b522e'; x.textAlign = 'center'; x.font = `500 ${R * 0.05}px Georgia, serif`; x.fillText('ZARUMEI', 0, -R * 0.22);
    x.font = `400 ${R * 0.028}px Helvetica, Arial`; x.fillText('QUARTZ', 0, R * 0.46);
  } else if (kind === 'recta') {
    x.setTransform(1, 0, 0, 1, 0, 0);
    const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#fbfaf6'); g.addColorStop(1, '#e5dfd4');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.strokeStyle = '#1c1c1c'; x.lineWidth = 3;
    const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    x.fillStyle = '#161616'; x.font = `500 ${S * 0.052}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    romans.forEach((t, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; x.fillText(t, S / 2 + Math.cos(a) * S * 0.3, S / 2 + Math.sin(a) * S * 0.2); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 - Math.PI / 2; const r1 = S * (i % 5 ? 0.355 : 0.34), r2 = S * 0.375; x.lineWidth = i % 5 ? 2 : 4; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1); x.lineTo(S / 2 + Math.cos(a) * r2, S / 2 + Math.sin(a) * r2); x.stroke(); }
    x.fillStyle = '#1a1a1a'; x.font = `500 ${S * 0.042}px Georgia, serif`; x.fillText('ZARUMEI', S / 2, S * 0.46);
    x.font = `400 ${S * 0.02}px Helvetica, Arial`; x.fillStyle = '#6d675f'; x.fillText('QUARTZ', S / 2, S * 0.53);
  } else if (kind === 'diablo' || kind === 'espina' || kind === 'ala' || kind === 'orbital') {
    grandDial(x, R, kind);
  } else if (ART[kind]) {
    artDial(x, R, kind, images, opts.grand);
  } else if (ATELIER[kind]) {
    if (opts.grand) atelierGrand(x, R, kind, opts.grand);
    else atelierFace(x, R, kind, !!opts.date, day);
  } else { // rose: laca blanca + arte del oso ZARUMEI neón
    const g = x.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ece9e6');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; const [x1, y1] = P(R * 0.985, i * 6), [x2, y2] = P(R * 0.955, i * 6); x.strokeStyle = '#c99a85'; x.lineWidth = 2; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
    const a = images.roseArt, w = R * 1.08, h = w * a.height / a.width; x.drawImage(a, -w / 2 - R * 0.01, -h / 2 + R * 0.06, w, h);
    x.textAlign = 'center'; x.fillStyle = '#9b6b58'; x.font = `600 ${R * 0.038}px Helvetica, Arial`; x.fillText('QUARTZ', 0, R * 0.74);
  }
  return tex(c);
}
// Disco de fecha (anillo con 1–31) para la pieza 3D
export function dateDiscTexture() {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  x.fillStyle = '#fbfaf4'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#111'; x.font = `bold ${R * 0.09}px Helvetica`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let d = 1; d <= 31; d++) { x.save(); x.rotate((d - 1) / 31 * Math.PI * 2 + Math.PI / 2); x.translate(0, -R * 0.9); x.rotate(-Math.PI / 2); x.fillText(String(d), 0, 0); x.restore(); }
  return tex(c);
}
export function batteryTexture() {
  const S = 256, c = canvas(S), x = c.getContext('2d'); const g = x.createRadialGradient(100, 90, 10, 128, 128, 128); g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#9aa1a8');
  x.fillStyle = g; x.fillRect(0, 0, S, S); x.fillStyle = '#333'; x.textAlign = 'center'; x.font = 'bold 46px Helvetica'; x.fillText('377', 128, 112); x.font = 'bold 22px Helvetica'; x.fillText('SR626SW', 128, 146); x.fillText('1.55V  +', 128, 176);
  return tex(c);
}
export function ceramicBezelTexture() {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  const g = x.createRadialGradient(0, 0, R * 0.6, 0, 0, R); g.addColorStop(0, '#13307a'); g.addColorStop(1, '#0b1d4e'); x.fillStyle = g; x.fillRect(-R, -R, S, S);
  x.fillStyle = '#e9eef7'; x.strokeStyle = '#e9eef7'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 1; i < 60; i++) {
    const a = i * 6;
    if (i % 10 === 0) { const [px, py] = P(R * 0.9, a); x.save(); x.translate(px, py); x.rotate(a * Math.PI / 180); x.font = `bold ${R * 0.085}px Helvetica`; x.fillText(String(i), 0, 0); x.restore(); }
    else if (i < 15 || i % 5 === 0) { const [x1, y1] = P(R * 0.96, a), [x2, y2] = P(R * (i % 5 ? 0.88 : 0.84), a); x.lineWidth = i % 5 ? 4 : 10; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
  }
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, -R * 0.9, R * 0.045, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#c9d3e3'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, -R * 0.83); x.lineTo(-R * 0.07, -R * 0.97); x.lineTo(R * 0.07, -R * 0.97); x.closePath(); x.stroke();
  return tex(c);
}
// BISEL: graduación de 60 min grabada (oro con grabado oscuro), triángulo a las 12
export function bezelTexture() {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  x.fillStyle = '#ffffff'; x.fillRect(-R, -R, S, S); // blanco = color del metal sin alterar
  x.fillStyle = '#3a2606'; x.strokeStyle = '#3a2606'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 60; i++) {
    const a = i * 6;
    if (i === 0) continue;
    if (i % 10 === 0) {
      const [px, py] = P(R * 0.9, a);
      x.save(); x.translate(px, py); x.rotate(a * Math.PI / 180);
      x.font = `bold ${R * 0.085}px Georgia, serif`; x.fillText(String(i), 0, 0); x.restore();
    } else {
      const [x1, y1] = P(R * (i % 5 ? 0.95 : 0.97), a), [x2, y2] = P(R * (i % 5 ? 0.88 : 0.84), a);
      x.lineWidth = i % 5 ? 4 : 9; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    }
  }
  x.fillStyle = '#3a2606'; x.beginPath(); x.moveTo(0, -R * 0.82); x.lineTo(-R * 0.06, -R * 0.97); x.lineTo(R * 0.06, -R * 0.97); x.fill();
  return tex(c);
}
function starAt(x, cx, cy, r) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
  }
  x.closePath(); x.fill();
}
// El anillo visible del bisel cae en el borde exterior de la textura (≈ 0,84–1 R).
export function starBezel() {
  const S = 1024, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  x.fillStyle = '#c8102e'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#002a8f'; x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; starAt(x, Math.cos(a) * R * 0.935, Math.sin(a) * R * 0.935, R * 0.032); }
  return tex(c);
}
export function splashBezel() {
  const S = 1024, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  const cols = ['#ff3b6a', '#ffb703', '#7cff6b', '#3ec6ff', '#b388ff', '#ff7a18'];
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2;
    x.fillStyle = cols[i % cols.length];
    x.beginPath(); x.arc(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, R * 0.07, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#111'; x.font = `700 ${R * 0.055}px Helvetica, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const [n, a] of [['15', 0], ['30', 90], ['45', 180], ['60', 270]]) {
    const rad = a * Math.PI / 180;
    x.save(); x.translate(Math.cos(rad) * R * 0.92, Math.sin(rad) * R * 0.92); x.rotate(rad + Math.PI / 2); x.fillText(n, 0, 0); x.restore();
  }
  return tex(c);
}
export function wreathBezel() {
  const S = 1024, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  x.fillStyle = '#8a6a2a'; x.fillRect(-R, -R, S, S);
  x.strokeStyle = '#f3e0a4'; x.fillStyle = '#f3e0a4'; x.lineWidth = 3;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    x.save(); x.translate(Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93); x.rotate(a + Math.PI / 2);
    x.beginPath(); x.ellipse(0, 0, R * 0.02, R * 0.045, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  return tex(c);
}
export function natoTexture(stripes) {
  const cols = stripes && stripes.length ? stripes : ['#1aa3a8', '#f2d24b', '#e23b2f', '#1f8a3a'];
  const S = 256, c = canvas(S, 64), x = c.getContext('2d');
  cols.forEach((col, i) => { x.fillStyle = col; x.fillRect(i * S / cols.length, 0, S / cols.length + 1, 64); });
  return tex(c);
}
export function splatterTexture() {
  const S = 512, c = canvas(S), x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(0, 0, S, S);
  const cols = ['#ff4d6d', '#ffd60a', '#4cc9f0', '#b5179e', '#80ed99', '#fb8500', '#7209b7'];
  for (let i = 0; i < 90; i++) {
    x.fillStyle = cols[i % cols.length];
    x.globalAlpha = 0.55 + (i % 5) * 0.08;
    x.beginPath(); x.arc((i * 97) % S, (i * 53) % S, 8 + (i % 7) * 6, 0, Math.PI * 2); x.fill();
  }
  x.globalAlpha = 1;
  return tex(c);
}
export function suedeTexture() {
  const S = 512, c = canvas(S), x = c.getContext('2d');
  x.fillStyle = '#f4efe4'; x.fillRect(0, 0, S, S);
  x.fillStyle = '#c47a45';
  for (let i = 0; i < 40; i++) {
    x.globalAlpha = 0.35 + (i % 4) * 0.12;
    x.beginPath(); x.ellipse((i * 80) % S, (i * 47) % S, 30 + (i % 5) * 14, 18 + (i % 3) * 8, i, 0, Math.PI * 2); x.fill();
  }
  x.globalAlpha = 1;
  return tex(c);
}

// FONDO ROSCADO: grabado circular
export function casebackTexture(txt = 'ZARUMEI · AUTOMATIC · 28.800 A/h · WATER RESISTANT 100 M · ORO 18K · Nº 001 · ', mono = 'Z') {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2;
  x.translate(R, R);
  x.fillStyle = '#ffffff'; x.fillRect(-R, -R, S, S);
  x.strokeStyle = '#6e4a10'; x.lineWidth = 5;
  for (const r of [0.92, 0.7, 0.5]) { x.beginPath(); x.arc(0, 0, R * r, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = '#5a3c0b'; x.font = `bold ${R * 0.075}px Helvetica, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  const step = (Math.PI * 2) / txt.length;
  for (let i = 0; i < txt.length; i++) { x.save(); x.rotate(i * step); x.fillText(txt[i], 0, -R * 0.81); x.restore(); }
  x.font = `900 ${R * 0.45}px Georgia, serif`; x.fillStyle = '#8a6420'; x.fillText(mono, 0, R * 0.03);
  return tex(c);
}

// Côtes de Genève (rayas) para puentes
export function cotesTexture() {
  const c = canvas(256), x = c.getContext('2d');
  for (let i = 0; i < 256; i++) {
    const t = (i % 48) / 48, v = 236 + Math.round(16 * Math.sin(t * Math.PI));
    x.fillStyle = `rgb(${v},${v},${Math.min(255, v + 2)})`; x.fillRect(i, 0, 1, 256);
  }
  const t = tex(c, { repeat: 1 }); t.rotation = 0.45; return t;
}
export function cotesRough() {
  const c = canvas(256), x = c.getContext('2d');
  for (let i = 0; i < 256; i++) {
    const t = (i % 48) / 48, v = t < 0.62 ? 46 : 210;
    x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i, 0, 1, 256);
  }
  const t = tex(c, { srgb: false, repeat: 1 }); t.rotation = 0.45; return t;
}
export function perlageTexture() {
  const c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
    const cx = i * 32 + (j % 2) * 16, cy = j * 30;
    const g = x.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, 16);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e4e0d8');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 15, 0, Math.PI * 2); x.fill();
  }
  return tex(c, { repeat: 1 });
}
export function perlageRough() {
  const c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
    const cx = i * 32 + (j % 2) * 16, cy = j * 30;
    const g = x.createRadialGradient(cx, cy, 1, cx, cy, 15);
    g.addColorStop(0, '#e4e4e4'); g.addColorStop(0.65, '#5a5a5a'); g.addColorStop(1, '#9a9a9a');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 15, 0, Math.PI * 2); x.fill();
  }
  return tex(c, { srgb: false, repeat: 1 });
}
// Rotor: côtes + texto (flipY=false porque se aplica sobre UVs de ExtrudeGeometry en mm)
export function rotorTexture(R, txt = 'ZARUMEI · MIAMI') {
  const S = 1024, c = canvas(S), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#fff2c0'); g.addColorStop(.5, '#e0b04c'); g.addColorStop(1, '#a87b26');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalAlpha = .18; x.fillStyle = '#5a3c0b';
  for (let i = -S; i < 2 * S; i += 40) { x.save(); x.translate(i, 0); x.rotate(0.4); x.fillRect(0, -S, 20, 3 * S); x.restore(); }
  x.globalAlpha = 1; x.translate(S / 2, S / 2);
  x.fillStyle = '#4a3108'; x.font = `900 ${S * 0.07}px Helvetica, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  const span = Math.PI * 0.75;
  for (let i = 0; i < txt.length; i++) { const a = -span / 2 + span * i / (txt.length - 1); x.save(); x.rotate(a); x.fillText(txt[i], 0, -S * 0.36); x.restore(); }
  const t = tex(c, { flipY: false });
  t.repeat.set(1 / (2 * R), 1 / (2 * R)); t.offset.set(0.5, 0.5);
  return t;
}
// Madera del banco y alfombrilla
export function woodTexture() {
  const c = canvas(512), x = c.getContext('2d');
  x.fillStyle = '#5b3a1f'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    x.strokeStyle = `rgba(${30 + Math.random() * 40},${15 + Math.random() * 20},5,${0.15 + Math.random() * 0.2})`;
    x.lineWidth = 1 + Math.random() * 3; x.beginPath();
    const y = Math.random() * 512; x.moveTo(0, y);
    for (let k = 0; k <= 512; k += 32) x.lineTo(k, y + Math.sin(k / 60 + i) * 6);
    x.stroke();
  }
  return tex(c, { repeat: 3 });
}
export function matTexture(logo) {
  const c = canvas(1024), x = c.getContext('2d');
  x.fillStyle = '#1f3a2e'; x.fillRect(0, 0, 1024, 1024);
  x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2;
  for (let i = 0; i < 1024; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1024); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(1024, i); x.stroke(); }
  if (logo) { x.globalAlpha = .55; const h = 200, w = h * logo.width / logo.height; x.drawImage(logo, 1024 - w - 40, 1024 - h - 40, w, h); x.globalAlpha = 1; }
  x.fillStyle = 'rgba(233,196,106,.6)'; x.font = 'bold 34px Helvetica'; x.fillText('LA FORY TOOLS & JEWELRY', 40, 990);
  return tex(c);
}

// Pantalla del timegrapher (boot con logo LA FORY y traza)
export function makeTGScreen(logo) {
  const c = canvas(512, 256), x = c.getContext('2d'), t = tex(c);
  function boot() {
    x.fillStyle = '#07110d'; x.fillRect(0, 0, 512, 256);
    if (logo) { const h = 190, w = h * logo.width / logo.height; x.drawImage(logo, 40, 30, w, h); }
    x.fillStyle = '#e9c46a'; x.font = 'bold 30px Helvetica'; x.fillText('LA FORY', 250, 100);
    x.fillStyle = '#8fd8b0'; x.font = '20px Courier New'; x.fillText('TIMEGRAPHER TG-1', 250, 132); x.fillText('Escuchando…', 250, 160);
    t.needsUpdate = true;
  }
  function trace(v) {
    x.fillStyle = '#07110d'; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#163a2a'; x.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 190); x.stroke(); }
    for (let j = 0; j <= 190; j += 32) { x.beginPath(); x.moveTo(0, j); x.lineTo(512, j); x.stroke(); }
    x.fillStyle = '#0f241b'; x.fillRect(0, 192, 512, 64); x.font = 'bold 26px Courier New';
    if (v.none) { x.fillStyle = '#ff8a6b'; for (let i = 0; i < 512; i += 3) x.fillRect(i, 95 + (Math.random() - .5) * 60 * Math.random(), 2, 2); x.fillText('SIN SEÑAL · PARADO', 14, 234); }
    else if (v.quartz) { x.fillStyle = '#8fffc6'; for (let i = 16; i < 512; i += 32) x.fillRect(i, 60, 4, 70); x.fillStyle = '#d9ffe9'; x.fillText(`CUARZO  +${v.rate}s/d  1 imp/s`, 14, 234); }
    else {
      const k = -v.rate / 52 * 0.25;
      for (const [off, col] of [[-v.be * 10, '#8fffc6'], [v.be * 10, '#5ad1ff']]) {
        x.fillStyle = col; for (let i = 0; i < 512; i += 3) x.fillRect(i, 95 + off + (i - 256) * Math.max(-0.35, Math.min(0.35, k)) + (Math.random() - .5) * (v.noisy ? 40 : v.amp < 250 ? 6 : 2), 2.5, 2.5);
      }
      x.fillStyle = v.amp < 250 || Math.abs(v.rate) > 15 ? '#ffb35b' : '#d9ffe9';
      x.fillText(`${v.rate > 0 ? '+' : ''}${v.rate}s/d  ${v.amp}°  ${v.be.toFixed(1)}ms`, 14, 234);
    }
    x.fillStyle = '#e9c46a'; x.font = 'bold 14px Helvetica'; x.fillText('LA FORY TG-1', 400, 250);
    t.needsUpdate = true;
  }
  boot();
  return { texture: t, boot, trace };
}

// ── Boutique: cuero del banco, terciopelo y ónix (procedurales, baratos para móvil) ──
function noiseFill(x, w, h, base, amp, n = 9000, sz = 2) {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { const v = Math.random(); x.fillStyle = v > 0.5 ? `rgba(255,255,255,${amp * Math.random()})` : `rgba(0,0,0,${amp * 1.6 * Math.random()})`; x.fillRect(Math.random() * w, Math.random() * h, sz * Math.random() + 0.6, sz * Math.random() + 0.6); }
}
// cuero negro granulado con pespunte dorado y el logo LA FORY en relieve dorado (tapete del banco)
export function leatherTexture(logo) {
  const W = 1024, H = 792, c = canvas(W, H), x = c.getContext('2d');
  noiseFill(x, W, H, '#0e0907', 0.045, 26000, 2.2);
  // poros del cuero
  for (let i = 0; i < 5000; i++) { x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 1.3, 0, 7); x.fill(); }
  const g = x.createRadialGradient(W * 0.45, H * 0.45, 40, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(255,220,170,.07)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // ribete y pespunte
  x.strokeStyle = 'rgba(201,162,75,.55)'; x.lineWidth = 2; x.strokeRect(22, 22, W - 44, H - 44);
  x.setLineDash([10, 8]); x.strokeStyle = 'rgba(230,200,130,.75)'; x.lineWidth = 2.4; x.strokeRect(36, 36, W - 72, H - 72); x.setLineDash([]);
  if (logo) { x.globalAlpha = 0.16; const lw = 300, lh = lw * logo.height / logo.width; x.drawImage(logo, W * 0.80 - lw / 2, H * 0.78 - lh / 2, lw, lh); x.globalAlpha = 1; }
  x.fillStyle = 'rgba(214,180,100,.55)'; x.font = '600 20px "Cinzel", Georgia, serif'; x.textAlign = 'center'; x.fillText('LA FORY · ATELIER D’HORLOGERIE', W * 0.80, H - 52);
  return tex(c);
}
export function velvetTexture(color = '#0e2a21', rep = 1) {
  const c = canvas(256), x = c.getContext('2d'); noiseFill(x, 256, 256, color, 0.06, 7000, 1.4);
  return tex(c, { repeat: rep });
}
export function onyxTexture() {
  const c = canvas(512), x = c.getContext('2d'); noiseFill(x, 512, 512, '#0a0908', 0.025, 6000, 1.5);
  x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) { x.beginPath(); let px = Math.random() * 512, py = Math.random() * 512; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (Math.random() - 0.5) * 120; py += Math.random() * 70; x.lineTo(px, py); } x.stroke(); }
  return tex(c, { repeat: 6 });
}
// Grano de metal cepillado: rayas finas + arañazos. roughness y normal, sin color.
export function metalGrain() {
  const S = 256;
  const roughC = canvas(S), rx = roughC.getContext('2d');
  const normC = canvas(S), nx = normC.getContext('2d');
  const roughPx = rx.createImageData(S, S), normPx = nx.createImageData(S, S);
  const lines = new Float32Array(S);
  for (let y = 0; y < S; y++) lines[y] = 0.78 + Math.sin(y * 1.35) * 0.05 + (Math.random() - 0.5) * 0.07;
  for (let y = 0; y < S; y++) {
    const dy = lines[y] - lines[(y - 1 + S) % S];
    for (let x = 0; x < S; x++) {
      const nick = Math.random() < 0.0025 ? 0.22 : 0;
      const scratch = (y % 97 === 0 && x % 3 !== 0) ? 0.12 : 0;
      const r = Math.min(1, Math.max(0.28, lines[y] + (Math.random() - 0.5) * 0.035 - nick - scratch));
      const i = (y * S + x) * 4;
      const g = (r * 255) | 0;
      roughPx.data[i] = roughPx.data[i + 1] = roughPx.data[i + 2] = g; roughPx.data[i + 3] = 255;
      normPx.data[i] = Math.max(0, Math.min(255, 128 + (Math.random() - 0.5) * 14));
      normPx.data[i + 1] = Math.max(0, Math.min(255, 128 + dy * 380));
      normPx.data[i + 2] = 226; normPx.data[i + 3] = 255;
    }
  }
  rx.putImageData(roughPx, 0, 0); nx.putImageData(normPx, 0, 0);
  const wrap = (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); return t; };
  return { rough: wrap(tex(roughC, { srgb: false })), normal: wrap(tex(normC, { srgb: false })) };
}
// Paño de relojero: lino gris verdoso, trama visible.
export function clothTexture() {
  const S = 512, c = canvas(S), x = c.getContext('2d');
  x.fillStyle = '#2a3330'; x.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    x.strokeStyle = y % 2 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.035)';
    x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(S, y + 0.5); x.stroke();
  }
  for (let i = 0; i < S; i += 2) {
    x.strokeStyle = i % 4 === 0 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.07)';
    x.beginPath(); x.moveTo(i + 0.5, 0); x.lineTo(i + 0.5, S); x.stroke();
  }
  for (let i = 0; i < 500; i++) { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(Math.random() * S, Math.random() * S, 1, 3); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4); return t;
}
export function contactShadowTexture() {
  const S = 256, c = canvas(S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S * 0.48);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return tex(c);
}
export function galaxyTexture(tone) {
  const S = 1024, c = canvas(S), x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.48, S * 0.42, 30, S / 2, S / 2, S * 0.62);
  if (tone === 'blue') { g.addColorStop(0, '#2450a4'); g.addColorStop(0.42, '#071433'); g.addColorStop(1, '#02040c'); }
  else if (tone === 'amber') { g.addColorStop(0, '#f0c27a'); g.addColorStop(0.4, '#7a3b12'); g.addColorStop(1, '#1a0c04'); }
  else if (tone === 'emerald') { g.addColorStop(0, '#5ee0b0'); g.addColorStop(0.42, '#0c4a38'); g.addColorStop(1, '#021410'); }
  else { g.addColorStop(0, '#7a32a4'); g.addColorStop(0.4, '#2a0848'); g.addColorStop(1, '#07010f'); }
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 7; i++) {
    const cx = S * (0.25 + Math.random() * 0.5), cy = S * (0.25 + Math.random() * 0.5);
    const rg = x.createRadialGradient(cx, cy, 8, cx, cy, 90 + Math.random() * 120);
    const neb = tone === 'blue' ? 'rgba(90,150,255,.28)' : tone === 'amber' ? 'rgba(255,176,70,.26)' : tone === 'emerald' ? 'rgba(70,210,150,.26)' : 'rgba(190,90,255,.3)';
    rg.addColorStop(0, neb); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, 220, 0, 7); x.fill();
  }
  for (let i = 0; i < 900; i++) {
    const a = Math.random(); x.fillStyle = `rgba(255,255,255,${0.25 + a * 0.75})`;
    const s = a > 0.98 ? 2.4 : a > 0.9 ? 1.4 : 0.7; x.fillRect(Math.random() * S, Math.random() * S, s, s);
  }
  return tex(c);
}
export function subdialTexture() {
  const S = 512, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  const g = x.createRadialGradient(-30, -40, 8, 0, 0, R); g.addColorStop(0, '#f6e6b4'); g.addColorStop(0.5, '#d4ae58'); g.addColorStop(1, '#8d6424');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
  x.strokeStyle = '#3a2a10';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, r0 = i % 5 ? R * 0.8 : R * 0.7;
    x.lineWidth = i % 5 ? 2 : 4; x.beginPath(); x.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); x.lineTo(Math.sin(a) * R * 0.9, -Math.cos(a) * R * 0.9); x.stroke();
  }
  x.fillStyle = '#2a1c08'; x.textAlign = 'center'; x.font = '600 52px Georgia, Times, serif'; x.fillText('ZARUMEI', 0, -R * 0.22);
  x.font = '500 22px Georgia, Times, serif'; x.fillText('ZT-18', 0, R * 0.38);
  return tex(c);
}
export function engraveBand() {
  const c = canvas(2048, 256), x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 2048, 256);
  x.fillStyle = '#4a3214'; x.font = '600 118px Georgia, Times, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 4; i++) x.fillText('ZARUMEI', 256 + i * 512, 132);
  return tex(c);
}
export function gatorColor() {
  const c = canvas(256, 512), x = c.getContext('2d');
  x.fillStyle = '#1a140f'; x.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 36; row++) {
    const off = row % 2 ? 10 : 0;
    for (let col = 0; col < 12; col++) {
      x.fillStyle = (row + col) % 2 ? '#2c241c' : '#100e0c';
      x.beginPath(); x.ellipse(off + col * 22, row * 14 + 7, 9, 6, 0, 0, 7); x.fill();
      x.strokeStyle = '#3a3128'; x.lineWidth = 1; x.stroke();
    }
  }
  return tex(c);
}
// Bisel cerámico negro (Nácar / Verano): numerales blancos y triángulo de oro rosa a las 12.
export function ceramicBlackBezel() {
  const S = 2048, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  const g = x.createRadialGradient(0, 0, R * 0.55, 0, 0, R); g.addColorStop(0, '#1a1c1f'); g.addColorStop(1, '#050506');
  x.fillStyle = g; x.fillRect(-R, -R, S, S);
  x.fillStyle = '#f2f4f7'; x.strokeStyle = '#f2f4f7'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 1; i < 60; i++) {
    const a = i * 6;
    if (i % 10 === 0) { const [px, py] = P(R * 0.9, a); x.save(); x.translate(px, py); x.rotate(a * Math.PI / 180); x.font = `bold ${R * 0.09}px Helvetica`; x.fillText(String(i), 0, 0); x.restore(); }
    else { const [x1, y1] = P(R * 0.97, a), [x2, y2] = P(R * (i % 5 ? 0.9 : 0.84), a); x.lineWidth = i % 5 ? 5 : 12; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
  }
  x.fillStyle = '#c4896a'; x.beginPath(); x.moveTo(0, -R * 0.76); x.lineTo(-R * 0.075, -R * 0.98); x.lineTo(R * 0.075, -R * 0.98); x.closePath(); x.fill();
  return tex(c);
}
// Nácar: blanco con velos rosa y verde.
export function nacreTexture() {
  const S = 1024, c = canvas(S), x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.4, S * 0.35, 20, S / 2, S / 2, S * 0.7);
  g.addColorStop(0, '#fffefb'); g.addColorStop(0.45, '#f4efe6'); g.addColorStop(1, '#e7dfd2');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 9; i++) {
    x.strokeStyle = ['rgba(255,186,196,.35)', 'rgba(176,220,206,.4)', 'rgba(255,244,210,.45)', 'rgba(196,186,230,.28)'][i % 4];
    x.lineWidth = 18 + (i % 3) * 8; x.beginPath(); x.ellipse(S * 0.5, S * 0.5, 80 + i * 48, 40 + i * 22, i * 0.4, 0, 7); x.stroke();
  }
  return tex(c);
}
// Verano: cielo, palmas y agua detrás de la maquinaria.
export function tropicTexture() {
  const S = 1024, c = canvas(S), x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, S); sky.addColorStop(0, '#7ec8ef'); sky.addColorStop(0.42, '#b7e3a1'); sky.addColorStop(0.62, '#3f8f4a'); sky.addColorStop(0.78, '#1e6a86'); sky.addColorStop(1, '#0c3e55');
  x.fillStyle = sky; x.fillRect(0, 0, S, S);
  x.fillStyle = '#f6e27a'; x.beginPath(); x.arc(S * 0.72, S * 0.22, 48, 0, 7); x.fill();
  const palm = (px, py, sc) => {
    x.strokeStyle = '#6a4a22'; x.lineWidth = 7 * sc; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 40 * sc, px, py - 90 * sc); x.stroke();
    x.fillStyle = '#1f7a32';
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45; x.beginPath(); x.ellipse(px + Math.cos(a) * 28 * sc, py - 90 * sc + Math.sin(a) * 16 * sc, 26 * sc, 8 * sc, a, 0, 7); x.fill(); }
  };
  palm(180, 620, 1.3); palm(300, 560, 0.9); palm(780, 600, 1.1); palm(860, 520, 0.7);
  x.fillStyle = '#e7d7a2'; x.fillRect(0, 700, S, 40);
  x.fillStyle = '#d7b15a'; x.fillRect(470, 760, 70, 36); x.fillRect(492, 720, 26, 50); x.beginPath(); x.arc(505, 716, 16, Math.PI, 0); x.fill();
  return tex(c);
}
export function habanaSubdial() {
  const S = 512, c = canvas(S), x = c.getContext('2d'), R = S / 2; x.translate(R, R);
  const g = x.createRadialGradient(-40, -50, 10, 0, 0, R); g.addColorStop(0, '#3d74d6'); g.addColorStop(0.55, '#123a86'); g.addColorStop(1, '#071a44');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
  x.strokeStyle = '#e6c36a';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, r0 = i % 5 ? R * 0.78 : R * 0.68;
    x.lineWidth = i % 5 ? 2 : 4; x.beginPath(); x.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); x.lineTo(Math.sin(a) * R * 0.9, -Math.cos(a) * R * 0.9); x.stroke();
  }
  x.fillStyle = '#f3e2a8'; x.textAlign = 'center'; x.font = '600 46px Georgia, Times, serif'; x.fillText('ZARUMEI', 0, -R * 0.08);
  return tex(c);
}
