// Boutique LA FORY: vitrinas con foco sobre terciopelo, fichas con precio y vista de detalle 3D giratoria.
// Un solo WebGLRenderer pequeño, creado al abrir la boutique (miniaturas en caché, detalle a demanda).
import * as THREE from 'three';
import { makeStudioEnv } from './envmap.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PRODUCTS, BOUTIQUE_CATS, fmtPrice } from './data/boutique.js';
import { WATCHES } from './data/watches.js';
import { CALIBERS } from './data/calibers.js';
import { buildZR28, buildZQ11 } from './movement.js';
import { buildZT18 } from './tourbillon.js';
import { buildGrand } from './grand.js';
import { buildZX60 } from './habana.js';
import { buildCase } from './case3d.js';
import { makeTools } from './tools3d.js';
import { velvetTexture } from './textures.js';
import { vaticanNow } from './vatican.js';

const $ = (s) => document.querySelector(s);
let ctx = null; // { M, images }
let R = null, scene, camera, controls, env, pedestal, holder, raf = 0, T = null;
const thumbs = {};
export const wallet = {
  get balance() { return +(localStorage.getItem('zarumei.wallet') || 2500); },
  add(n) { localStorage.setItem('zarumei.wallet', String(this.balance + n)); },
  owned() { try { return JSON.parse(localStorage.getItem('zarumei.owned') || '[]'); } catch (e) { return []; } },
  buy(p) { if (this.owned().includes(p.id) || this.balance < p.price) return false; localStorage.setItem('zarumei.wallet', String(this.balance - p.price)); localStorage.setItem('zarumei.owned', JSON.stringify([...this.owned(), p.id])); return true; }
};
export function initBoutique(c) { ctx = c; }

function setup() {
  if (R) return;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
  scene = new THREE.Scene();
  env = makeStudioEnv(R); scene.environment = env; scene.environmentIntensity = 1.6; // mismo estudio que el banco: con la sala blanca el oro y el acero se veían crema
  camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
  scene.add(new THREE.HemisphereLight(0xfff3df, 0x1a0b0e, 0.35));
  const spot = new THREE.SpotLight(0xfff0d0, 2.0, 0, 0.5, 0.9, 0); spot.position.set(20, 160, 60); scene.add(spot, spot.target);
  const rimL = new THREE.DirectionalLight(0xffd8a0, 0.9); rimL.position.set(-80, 40, -60); scene.add(rimL);
  // pedestal de terciopelo burdeos con filo de oro y sombra de contacto falsa
  pedestal = new THREE.Group();
  const vel = new THREE.MeshStandardMaterial({ map: velvetTexture('#4a1220', 2), roughness: 1, color: 0xffffff });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(34, 36, 10, 64), vel); top.position.y = -5; pedestal.add(top);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(34.2, 0.45, 8, 96), new THREE.MeshStandardMaterial({ color: 0xd9b45e, metalness: 1, roughness: 0.25 })); edge.rotation.x = Math.PI / 2; pedestal.add(edge);
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d'); const gr = sx.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.05; pedestal.add(shadow);
  scene.add(pedestal);
  holder = new THREE.Group(); scene.add(holder);
  controls = new OrbitControls(camera, R.domElement); controls.enablePan = false; controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.6; controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.45;
  controls.addEventListener('start', () => (controls.autoRotate = false));
}

// ── modelos ──
const gold = (c = 0xe2b75a, r = 0.18) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r });
let _dm = null; const diamondMat = () => _dm || (_dm = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, metalness: 1, roughness: 0.02, envMapIntensity: 2.6, flatShading: true, emissive: 0x0a0d14 }));
function brilliant(d) { // perfil de talla brillante (corona + pabellón) con 8 facetas
  const r = d / 2, pts = [[0, -r * 0.86], [r, -0.0], [r * 0.98, r * 0.04], [r * 0.55, r * 0.32], [0, r * 0.32]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 8), diamondMat());
}
function jewel(kind) {
  const g = new THREE.Group();
  if (kind === 'ring') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(9, 1.25, 24, 96), gold()); band.scale.z = 1.5; g.add(band);
    const d = brilliant(7.2); d.position.y = 12.6; g.add(d);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 8), gold()); pr.position.set(Math.cos(a) * 3.1, 11.4, Math.sin(a) * 3.1); pr.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(pr); }
    g.rotation.x = -0.25; g.position.y = 10.5; return { g, size: 34 };
  }
  if (kind === 'chain') {
    const m = gold(0xe8bd5e, 0.12), link = new THREE.TorusGeometry(2.2, 0.9, 10, 22);
    const N = 34; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, l = new THREE.Mesh(link, m); l.position.set(Math.cos(a) * 17, 0, Math.sin(a) * 13); l.rotation.y = -a + Math.PI / 2; l.rotation.x = i % 2 ? Math.PI / 2 * 0.85 : 0.2; l.scale.set(1, 1, 0.7); g.add(l); }
    g.position.y = 1.8; return { g, size: 46 };
  }
  if (kind === 'pendant') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 1.6, 64), gold()); disc.rotation.x = Math.PI / 2; g.add(disc);
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const cx = cv.getContext('2d'); const lg = cx.createRadialGradient(256, 200, 20, 256, 256, 256); lg.addColorStop(0, '#16336b'); lg.addColorStop(1, '#07142e'); cx.fillStyle = lg; cx.beginPath(); cx.arc(256, 256, 256, 0, 7); cx.fill();
    const L = ctx.images.logo, lw = 330, lh = lw * L.height / L.width; cx.drawImage(L, 256 - lw / 2, 256 - lh / 2, lw, lh);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ map: t, metalness: 0.1, roughness: 0.25 })); face.position.z = 0.82; g.add(face);
    const enamel = new THREE.Mesh(new THREE.CircleGeometry(9.3, 48), new THREE.MeshStandardMaterial({ color: 0x0b1b3a, roughness: 0.2 })); enamel.position.z = 0.81; g.add(enamel);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, d = brilliant(1.3); d.rotation.x = Math.PI / 2; d.position.set(Math.cos(a) * 10.1, Math.sin(a) * 10.1, 0.9); g.add(d); }
    const bail = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.6, 10, 24), gold()); bail.position.y = 13; bail.rotation.y = Math.PI / 2; g.add(bail);
    g.position.y = 14; return { g, size: 38 };
  }
  if (kind === 'earrings') {
    for (const sx of [-1, 1]) { const e = new THREE.Group(); const d = brilliant(6); d.rotation.x = Math.PI / 2 * 0.9; e.add(d); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.6, 6), gold(0xe6e8ec, 0.15)); pr.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, -0.5); pr.rotation.x = Math.PI / 2; e.add(pr); } const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8, 8), gold(0xe6e8ec, 0.15)); post.rotation.x = Math.PI / 2; post.position.z = -4.5; e.add(post); e.position.set(sx * 7, 5, 0); e.rotation.y = sx * 0.25; g.add(e); }
    return { g, size: 30 };
  }
  // tennis
  const m = gold(0xe7a98e, 0.18); const N = 40;
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; const set = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 1.4, 8), m); set.position.set(Math.cos(a) * 15, 1.2, Math.sin(a) * 12); g.add(set); const d = brilliant(2.4); d.position.set(Math.cos(a) * 15, 2.2, Math.sin(a) * 12); g.add(d); }
  return { g, size: 42 };
}
function watchModel(id) {
  const W = WATCHES[id], cal = CALIBERS[W.caliber], M = ctx.M;
  const MV = W.caliber === 'ZQ11' ? buildZQ11(M, ctx.images, W, cal) : W.caliber === 'ZX60' ? buildZX60(M, ctx.images, W, cal) : W.caliber === 'ZT18' ? buildZT18(M, ctx.images, W, cal) : W.grand ? buildGrand(M, ctx.images, W, cal) : buildZR28(M, ctx.images, W, cal);
  const CS = buildCase(M, W, MV.R); const root = new THREE.Group(); root.add(CS.body);
  const mount = new THREE.Group(); mount.rotation.z = Math.PI; mount.add(MV.mv); root.add(mount); root.add(CS.caseback);
  for (const s of Object.values(MV.screws)) s.ghost.visible = false;
  const d = new Date(); const set = (n, v) => { const r = MV.parts[n] && MV.parts[n].getObjectByName('rot'); if (r) r.rotation.y = -v * Math.PI * 2; };
  set('secHand', 0.62); set('minHand', 0.17); set('hourHand', (10 + 10 / 60) / 12);
  const rc = MV.parts.dial && MV.parts.dial.userData.recta;
  if (rc) {
    const v = vaticanNow(d);
    if (rc.moonTex) rc.moonTex.userData.paint(v.phase);
    if (rc.day) rc.day.rotation.y = (v.dow / 7) * Math.PI * 2;
    if (rc.month) rc.month.rotation.y = (v.month / 12) * Math.PI * 2;
    if (rc.year) rc.year.rotation.y = (1 / rc.yearN) * Math.PI * 2;
    const g = rc.gmt && rc.gmt.getObjectByName('rot');
    if (g) g.rotation.y = -(v.h24 / 24) * Math.PI * 2;
  }
  const g = new THREE.Group(); root.rotation.x = 1.05; root.position.y = 30; g.add(root); return { g, size: 70 };
}
function toolModel(id) {
  if (!T) T = makeTools(ctx.M, ctx.images, 12.8);
  if (id === 'timegrapher') { const g = new THREE.Group(); const tg = T.tg.clone(); tg.scale.setScalar(0.62); tg.position.y = 0; g.add(tg); return { g, size: 64 }; }
  const m = T.models[id].clone(); const g = new THREE.Group(); m.rotation.z = id === 'loupe' ? 0 : 1.15; m.position.y = id === 'loupe' ? 6 : 6; g.add(m);
  if (id === 'screwdriver') for (let i = 1; i < 5; i++) { const c = T.models.screwdriver.clone(); c.rotation.z = 1.15; c.position.set(-8 + i * 4, 6, -10 + i * 5); g.add(c); }
  return { g, size: id === 'screwdriver' ? 56 : 44 };
}
function show(p) {
  if (boxRig) boxRig.visible = false;
  pedestal.visible = true;
  holder.clear();
  const { g, size } = p.model.type === 'watch' ? watchModel(p.model.watch) : p.model.type === 'tool' ? toolModel(p.model.tool) : jewel(p.model.kind);
  pedestal.scale.setScalar(p.model.type === 'jewel' ? Math.max(0.55, size / 62) : 1);
  holder.add(g); const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3());
  controls.target.set(0, Math.max(6, c.y * 0.9), 0);
  const dist = size / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25;
  camera.position.set(0, controls.target.y + dist * 0.42, dist); controls.minDistance = dist * 0.5; controls.maxDistance = dist * 1.8; controls.update();
}
async function makeThumbs(list) {
  setup(); const sz = 300; R.setSize(sz, sz, false); camera.aspect = 1; camera.updateProjectionMatrix(); controls.autoRotate = false;
  for (const p of list) {
    if (thumbs[p.id]) continue;
    // con el detalle abierto, esperar: las miniaturas comparten soporte y lienzo con el visor
    if (!$('#bqDetail').hidden) { while (!$('#bqDetail').hidden) await new Promise(r => setTimeout(r, 400)); R.setSize(sz, sz, false); camera.aspect = 1; camera.fov = 30; camera.updateProjectionMatrix(); controls.autoRotate = false; }
    show(p); holder.rotation.y = -0.45; controls.update(); R.render(scene, camera); thumbs[p.id] = R.domElement.toDataURL('image/webp', 0.85);
    const img = document.querySelector(`.vitrine[data-id="${p.id}"] img.item`); if (img) { img.src = thumbs[p.id]; img.classList.add('in'); }
    await new Promise(r => requestAnimationFrame(r));
  }
  holder.rotation.y = 0;
}
const portraits = {};
let boxRig = null, boxShot = null, portraitQ = [], portraitOn = null, portraitBusy = false;
function ensureBox() {
  if (boxRig) return;
  boxRig = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0x140e0a, roughness: 0.62, metalness: 0.12 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd9b45e, metalness: 1, roughness: 0.26 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x4a1522, roughness: 0.92 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(54, 10, 40), leather); base.position.y = 5; boxRig.add(base);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(54.8, 0.45, 40.8), goldM); rim.position.y = 10.15; boxRig.add(rim);
  const cush = new THREE.Mesh(new THREE.CylinderGeometry(15, 16.2, 2.4, 40), cushion); cush.position.y = 11.3; boxRig.add(cush);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(54, 1.4, 40), leather);
  lid.position.set(0, 22, -28); lid.rotation.x = -1.05; boxRig.add(lid);
  const lidRim = new THREE.Mesh(new THREE.BoxGeometry(54.6, 0.28, 40.5), goldM);
  lidRim.position.set(0, 22.9, -28); lidRim.rotation.x = -1.05; boxRig.add(lidRim);
  scene.add(boxRig); boxRig.visible = false;
}
function shootPortrait(id) {
  setup(); ensureBox();
  const exposure = R.toneMappingExposure, envI = scene.environmentIntensity;
  R.toneMappingExposure = 1.35; scene.environmentIntensity = 1.15;
  R.setClearColor(0x070605, 1);
  pedestal.visible = false; holder.clear();
  if (!boxShot) {
    boxRig.visible = true;
    const prev = boxRig.getObjectByName('watch'); if (prev) boxRig.remove(prev);
    R.setSize(480, 640, false); camera.aspect = 480 / 640; camera.fov = 32; camera.updateProjectionMatrix();
    camera.position.set(86, 74, 108); camera.lookAt(0, 14, -8);
    R.render(scene, camera);
    boxShot = R.domElement.toDataURL('image/jpeg', 0.82);
  }
  boxRig.visible = false;
  const { g } = watchModel(id);
  const root = g.children[0];
  root.rotation.x = Math.PI / 2;
  root.position.y = 0;
  holder.add(g);
  g.updateMatrixWorld(true);
  const wb = new THREE.Box3().setFromObject(g);
  const c = wb.getCenter(new THREE.Vector3());
  const size = wb.getSize(new THREE.Vector3());
  g.position.sub(c);
  const dial = Math.max(size.x, size.z);
  const fov = 24;
  const dist = (dial / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.05;
  R.setSize(480, 640, false); camera.aspect = 480 / 640; camera.fov = fov; camera.updateProjectionMatrix();
  camera.position.set(0, dial * 0.02, dist);
  camera.lookAt(0, 0, 0);
  R.render(scene, camera);
  portraits[id] = { face: R.domElement.toDataURL('image/jpeg', 0.84), box: boxShot };
  holder.clear();
  R.toneMappingExposure = exposure; scene.environmentIntensity = envI;
}
function pumpPortraits() {
  if (portraitBusy) return;
  portraitBusy = true;
  const step = () => {
    // con el detalle abierto, los retratos esperan: comparten escena, cámara y soporte con el visor y le robaban el reloj
    if (!$('#bqDetail').hidden) { setTimeout(() => requestAnimationFrame(step), 500); return; }
    const id = portraitQ.shift();
    if (!id) {
      portraitBusy = false; pedestal.visible = true;
      if (boxRig) boxRig.visible = false;
      return;
    }
    try { if (!portraits[id]) shootPortrait(id); if (portraitOn) portraitOn(id, portraits[id]); }
    catch (err) { console.warn('retrato', id, err); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
export function queuePortraits(ids, onOne) {
  portraitOn = onOne;
  for (const id of ids) {
    if (portraits[id]) { if (onOne) onOne(id, portraits[id]); continue; }
    if (!portraitQ.includes(id)) portraitQ.push(id);
  }
  pumpPortraits();
}
function renderShop() {
  $('#bqWallet').textContent = fmtPrice(wallet.balance); const owned = wallet.owned();
  const host = $('#bqSections'); host.innerHTML = '';
  for (const c of BOUTIQUE_CATS) {
    const sec = document.createElement('section'); sec.className = 'bqsec'; sec.id = 'bq-' + c.id;
    sec.innerHTML = `<div class="bqhead"><span class="rule"></span><div><small>${c.line}</small><h3 class="foil">${c.name}</h3></div><span class="rule"></span></div><div class="vitrines"></div>`;
    const grid = sec.querySelector('.vitrines');
    for (const p of PRODUCTS.filter(x => x.cat === c.id)) {
      const b = document.createElement('button'); b.className = 'vitrine' + (owned.includes(p.id) ? ' owned' : ''); b.dataset.id = p.id;
      b.innerHTML = `<div class="glass"><i class="beam"></i><img class="item${thumbs[p.id] ? ' in' : ''}" alt="" ${thumbs[p.id] ? `src="${thumbs[p.id]}"` : ''}><i class="stand"></i><i class="glint"></i></div><div class="tag"><b>${p.name}</b><small>${p.line}</small><span class="price">${owned.includes(p.id) ? 'En tu colección' : fmtPrice(p.price)}</span></div>`;
      b.onclick = () => openDetail(p); grid.appendChild(b);
    }
    host.appendChild(sec);
  }
}
function loop() { raf = requestAnimationFrame(loop); controls.update(); R.render(scene, camera); }
function openDetail(p) {
  setup(); const stageEl = $('#bqStage'); stageEl.appendChild(R.domElement);
  $('#bqDetail').hidden = false; const r = stageEl.getBoundingClientRect(); R.setSize(r.width, r.height); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  R.setClearColor(0x000000, 0); camera.fov = 30; holder.rotation.y = 0; // los retratos dejan fondo opaco y otro campo de visión
  show(p); controls.autoRotate = true; cancelAnimationFrame(raf); loop();
  const owned = wallet.owned().includes(p.id), can = wallet.balance >= p.price;
  $('#bqInfo').innerHTML = `<small class="cinzel">${BOUTIQUE_CATS.find(c => c.id === p.cat).line}</small><h2 class="foil">${p.name}</h2><p class="line">${p.line}</p><p>${p.desc}</p><ul>${p.specs.map(s => `<li>${s}</li>`).join('')}</ul>
    <div class="buy"><span class="price big">${fmtPrice(p.price)}</span><button class="lux primary" id="bqBuy" ${owned || !can ? 'disabled' : ''}>${owned ? 'En tu colección ✓' : can ? 'Adquirir' : 'Saldo insuficiente'}</button></div><p class="small">Saldo del taller: ${fmtPrice(wallet.balance)} · Colección ficticia del juego: se paga con lo que cobras por cada reparación.</p>`;
  const bb = $('#bqBuy'); if (bb) bb.onclick = () => { if (wallet.buy(p)) { renderShop(); openDetail(p); } };
}
function closeDetail() { cancelAnimationFrame(raf); $('#bqDetail').hidden = true; }
window.addEventListener('resize', () => { if (R && !$('#bqDetail').hidden) { const r = $('#bqStage').getBoundingClientRect(); R.setSize(r.width, r.height); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); } });
export function openBoutique() {
  $('#boutique').hidden = false; renderShop();
  $('#bqClose').onclick = () => { closeDetail(); $('#boutique').hidden = true; };
  $('#bqDetClose').onclick = () => $('#bqClose').onclick(); // el ✕ de arriba queda bajo el visor 3D del detalle: el detalle lleva el suyo
  $('#bqBack').onclick = closeDetail;
  document.querySelectorAll('.bqnav button').forEach(b => b.onclick = () => document.getElementById('bq-' + b.dataset.cat).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  setTimeout(() => makeThumbs(PRODUCTS), 60);
}
if (/[?&]test=1\b/.test(location.search)) window.__boutique = { open: openBoutique, detail: (id) => openDetail(PRODUCTS.find(p => p.id === id)), close: () => { closeDetail(); $('#boutique').hidden = true; }, get ready() { return PRODUCTS.every(p => thumbs[p.id]); }, wallet };
