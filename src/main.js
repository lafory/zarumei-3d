// ZARUMEI · Taller de Relojería 3D — LA FORY Tools & Jewelry
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TOOLS, SCREWDRIVER_SIZES } from './data/tools.js';
import { WATCHES } from './data/watches.js';
import { CALIBERS } from './data/calibers.js';
import { FAULTS } from './data/faults.js';
import { STORY } from './data/story.js';
import { createEngine } from './engine.js';
import { loadAllImages, leatherTexture, velvetTexture, onyxTexture } from './textures.js';
import { openBoutique, initBoutique, wallet } from './boutique.js';
import { fmtPrice } from './data/boutique.js';
import { makeMaterials } from './materials.js';
import { buildZR28, buildZQ11 } from './movement.js';
import { buildCase } from './case3d.js';
import { makeTools } from './tools3d.js';
import { ICONS } from './icons.js';

const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const SUBS = ['jewel', 'spring', 'regulator'];

// ───────── tweens ─────────
const tweens = [];
const ease = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function tween(dur, update) { return new Promise(res => tweens.push({ t0: performance.now(), dur, update, done: res })); }
function runTweens(now) { for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i], k = Math.min(1, (now - tw.t0) / tw.dur); tw.update(ease(k), k); if (k >= 1) { tweens.splice(i, 1); tw.done(); } } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let SPEED = 1; const D = (ms) => ms * SPEED; // las pruebas pueden acelerar las animaciones

// ───────── renderer / escena ─────────
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
// DPR: hasta 2 en móvil; en pantallas grandes se baja para no superar ~2,6 MP de render (rendimiento en iPad/escritorio 4K)
function applyDPR(w, h) { const dpr = window.devicePixelRatio || 1; const budget = 2.6e6; const cap = Math.min(2, Math.max(1, Math.sqrt(budget / Math.max(1, w * h)))); renderer.setPixelRatio(Math.min(dpr, cap)); }
applyDPR(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x080706); scene.fog = new THREE.Fog(0x080706, 260, 560);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, 1, 1, 1500);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = true; controls.screenSpacePanning = true; controls.panSpeed = 0.6; // ratón: botón derecho = desplazar; táctil: dos dedos controls.maxPolarAngle = 1.3; controls.minPolarAngle = 0.02; controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.9;
scene.add(new THREE.HemisphereLight(0xfff1dc, 0x140d08, 0.4));
// foco de vitrina: cono cálido y suave sobre el banco (sin sombras: barato en móvil)
const spot = new THREE.SpotLight(0xffe2b0, 1.3, 0, 0.62, 0.85, 0); spot.position.set(0, 230, 70); spot.target.position.set(0, 0, 10); scene.add(spot, spot.target);
const sun = new THREE.DirectionalLight(0xfff4e6, 1.25); sun.position.set(60, 140, 80); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 420 }); sun.shadow.bias = -0.0005; scene.add(sun);
const lamp = new THREE.PointLight(0xffd59a, 1.2, 0, 0); lamp.position.set(-40, 90, 40); scene.add(lamp);

const HOLDER_POS = new THREE.Vector3(-64, 0, 14), INSPECT_POS = new THREE.Vector3(-36, 0.6, 60), TG_POS = new THREE.Vector3(100, 0, -72), TRAY_POS = new THREE.Vector3(34, 0, -12);
let images, M, T, G = null; // G = partida actual
const toolGroup = new THREE.Group(); scene.add(toolGroup);
let floatingTool = null, sel = null, size = 1.0, view = 'front', busy = false, started = false, t0 = 0, mode = 'story', storyCase = null;

// ───────── cámara ─────────
function partWorldCenter(obj) { const b = new THREE.Box3().setFromObject(obj); return { c: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).length() / 2 }; }
let loupeTarget = null;
const VIEWS = {
  front: () => ({ target: new THREE.Vector3(0, 4, 4), size: G && G.W.case.style === 'slim' ? 46 : 52, dir: new THREE.Vector3(0, 1, 0.5) }),
  back: () => ({ target: new THREE.Vector3(0, 3, 2), size: 46, dir: new THREE.Vector3(0, 1, 0.5) }),
  holder: () => ({ target: HOLDER_POS.clone().add(new THREE.Vector3(0, 10, 0)), size: 36, dir: new THREE.Vector3(0, 1, 0.45) }),
  mat: () => ({ target: INSPECT_POS.clone().add(new THREE.Vector3(0, 2.2, 0)), size: 13, dir: new THREE.Vector3(0, 1, 0.42) }),
  tray: () => ({ target: TRAY_POS.clone().add(new THREE.Vector3(52, 0, 56)), size: 128, dir: new THREE.Vector3(0, 1, 0.38) }),
  loupe: () => ({ target: loupeTarget.c, size: Math.max(7, loupeTarget.r * 2.1), dir: new THREE.Vector3(0, 1, 0.42) }),
  tg: () => { const c = new THREE.Vector3(), n = new THREE.Vector3(0, 0, 1); T.screen.getWorldPosition(c); n.applyQuaternion(T.screen.getWorldQuaternion(new THREE.Quaternion())); return { target: c.add(new THREE.Vector3(-6, -2, 0)), size: 62, dir: n.add(new THREE.Vector3(0, 0.35, 0)) }; }
};
const VIEW_NAMES = { front: 'esfera', back: 'fondo / movimiento', holder: 'movimiento en el soporte', mat: 'alfombrilla de inspección', tray: 'bandeja de piezas', loupe: 'lupa x10', tg: 'timegrapher' };
function fitDistance(sz) { const v = THREE.MathUtils.degToRad(camera.fov) / 2; return Math.max((sz / 2) / Math.tan(v), (sz / 2) / (Math.tan(v) * camera.aspect)) * 1.05; }
async function setView(v, instant = false) {
  view = v; const cfg = VIEWS[v](), dist = fitDistance(cfg.size);
  const toPos = cfg.target.clone().add(cfg.dir.clone().normalize().multiplyScalar(dist));
  controls.minDistance = dist * 0.3; controls.maxDistance = dist * 2.4;
  $('#viewtag').textContent = 'Vista: ' + VIEW_NAMES[v]; stage.classList.toggle('loupe', v === 'loupe');
  document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('on', b.dataset.view === v || (b.dataset.view === 'watch' && (v === 'front' || v === 'back'))));
  updateFlipBtn();
  if (instant || SPEED < 0.2) { camera.position.copy(toPos); controls.target.copy(cfg.target); controls.update(); positionFloatingTool(); return; }
  const p0 = camera.position.clone(), t0v = controls.target.clone(); controls.enabled = false;
  await tween(D(650), (k) => { camera.position.lerpVectors(p0, toPos, k); controls.target.lerpVectors(t0v, cfg.target, k); });
  controls.enabled = true; positionFloatingTool();
}
function workView() { if (!G) return 'front'; return G.E.flags.mvLoc === 'holder' ? 'holder' : (G.E.flags.flipped ? 'back' : 'front'); }
function resize() {
  const r = stage.getBoundingClientRect(); applyDPR(r.width, r.height); renderer.setSize(r.width, r.height, false);
  renderer.domElement.style.width = r.width + 'px'; renderer.domElement.style.height = r.height + 'px';
  camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); if (G) renderer.render(scene, camera);
}
let rzQ = 0; new ResizeObserver(() => { cancelAnimationFrame(rzQ); rzQ = requestAnimationFrame(resize); }).observe(stage);
for (const ev of ['orientationchange', 'resize', 'fullscreenchange', 'webkitfullscreenchange']) window.addEventListener(ev, () => { setTimeout(() => { resize(); if (G) setView(view === 'loupe' && !loupeTarget ? workView() : view, true); }, 120); });
document.addEventListener('fullscreenchange', () => resize()); document.addEventListener('webkitfullscreenchange', () => resize());
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// ───────── construir el reloj elegido ─────────
function mergeStatic(group) {
  const byMat = new Map(), drop = [];
  group.updateMatrixWorld(true);
  group.children.forEach(m => { if (!m.isMesh || Array.isArray(m.material) || m.material.transparent || m.children.length) return; const k = m.material.uuid; if (!byMat.has(k)) byMat.set(k, []); byMat.get(k).push(m); });
  for (const [, list] of byMat) {
    if (list.length < 4) continue;
    const geos = list.map(m => { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.clearGroups(); return g; });
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    const mesh = new THREE.Mesh(merged, list[0].material); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); drop.push(...list);
  }
  drop.forEach(m => group.remove(m));
}
function disposeWorld() {
  if (!G) return;
  scene.remove(G.root); scene.remove(G.mvObj); scene.remove(T.tg); scene.remove(T.holder); scene.remove(T.tray);
  G.extra.forEach(o => scene.remove(o));
  for (const o of [G.root, G.mvObj, T.tg, T.holder, T.tray]) o.traverse(c => { if (c.geometry) c.geometry.dispose(); });
}
function buildWorld(watchId, faultId, story) {
  disposeWorld();
  const W = WATCHES[watchId], cal = CALIBERS[W.caliber];
  const MV = W.caliber === 'ZQ11' ? buildZQ11(M, images, W, cal) : buildZR28(M, images, W, cal);
  const CS = buildCase(M, W, MV.R); mergeStatic(CS.body);
  const root = new THREE.Group(); root.userData.partId = 'watch'; root.add(CS.body);
  CS.body.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
  const mvMount = new THREE.Group(); mvMount.rotation.z = Math.PI; root.add(mvMount); mvMount.add(MV.mv);
  root.add(CS.caseback); root.position.y = CS.dims.yFront; scene.add(root);
  T = makeTools(M, images, MV.R);
  T.tg.position.copy(TG_POS); T.tg.rotation.y = -0.75; scene.add(T.tg);
  T.holder.position.copy(HOLDER_POS); scene.add(T.holder);
  T.tray.position.copy(TRAY_POS); scene.add(T.tray);
  const parts = { ...MV.parts, caseback: CS.caseback, movement: MV.mv };
  const home = {};
  scene.updateMatrixWorld(true);
  for (const [id, o] of Object.entries(parts)) home[id] = { parent: o.parent, pos: o.position.clone(), quat: o.quaternion.clone(), scale: o.scale.clone() };
  for (const [sid, s] of Object.entries(MV.screws)) home[sid] = { parent: s.obj.parent, pos: s.obj.position.clone(), quat: s.obj.quaternion.clone(), scale: s.obj.scale.clone() };
  const E = createEngine({ watchId, faultId, story });
  G = { W, cal, MV, CS, root, mvMount, mvObj: MV.mv, parts, home, E, slots: {}, nextSlot: 0, extra: [], amp: 0 };
  initFaultVisuals();
  refreshGhosts();
}
function initFaultVisuals() {
  const f = G.E.F.id, S = G.MV.sub;
  if (f === 'aceiteSeco' && S.dirt) { S.dirt.visible = true; S.dirt.material.color.set(0x7a5a24); }
  if (f === 'ejeRoto' && S.pivot) { S.pivot.rotation.z = 0.9; S.pivot.position.x = 0.25; }
  if (f === 'desregulado' && S.regulator) S.regulator.rotation.y = 0.62;
}

// ───────── bandeja y movimientos de piezas ─────────
function slotOf(id) { if (!(id in G.slots)) G.slots[id] = G.nextSlot++; return G.slots[id]; }
function trayWorld(i) { return T.traySlot(i).add(TRAY_POS); }
async function moveWorld(obj, toPos, toQuat, toScale, dur = 800, lift = 16) {
  scene.attach(obj);
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.clone();
  if (SPEED < 0.2) { obj.position.copy(toPos); obj.quaternion.copy(toQuat); obj.scale.copy(toScale); return; }
  await tween(D(dur), (k) => { obj.position.lerpVectors(p0, toPos, k); obj.position.y += Math.sin(k * Math.PI) * lift; obj.quaternion.slerpQuaternions(q0, toQuat, k); obj.scale.lerpVectors(s0, toScale, k); });
}
function localBox(obj) { // caja de la pieza en su propio marco (sin rotación ni escala)
  const p = obj.position.clone(), q = obj.quaternion.clone(), s = obj.scale.clone(), par = obj.parent;
  scene.add(obj); obj.position.set(0, 0, 0); obj.quaternion.identity(); obj.scale.set(1, 1, 1); obj.updateMatrixWorld(true);
  const b = new THREE.Box3(); obj.traverse(o => { if (o.isMesh && !o.userData.isHit && o.visible && !o.userData.screwGhost) { o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  par.add(obj); obj.position.copy(p); obj.quaternion.copy(q); obj.scale.copy(s); return b;
}
async function fxRemove(id, inspect) {
  const obj = G.parts[id];
  if (id === 'movement') { await moveWorld(obj, HOLDER_POS.clone().add(new THREE.Vector3(0, 8.4, 0)), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1), 1100, 30); return; }
  if (id === 'caseback' && !G.E.quartz) { const r0 = obj.rotation.y; if (SPEED >= 0.2) await tween(D(500), (k) => { obj.rotation.y = r0 + k * 1.6; }); }
  const b = localBox(obj), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  const q = new THREE.Quaternion(); if (id === 'caseback') q.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  const s = inspect ? 1 : Math.min(0.62, 14.5 / Math.max(sz.x, sz.z, 1));
  const dest = inspect ? INSPECT_POS.clone() : trayWorld(slotOf(id));
  const off = c.clone().multiplyScalar(s); if (id === 'caseback') off.set(off.x, -b.max.y * s, -off.z); else off.y = b.min.y * s;
  await moveWorld(obj, dest.sub(new THREE.Vector3(off.x, off.y, off.z)), q, new THREE.Vector3(s, s, s), 850);
}
async function fxInstall(id) {
  const obj = G.parts[id], h = G.home[id];
  h.parent.attach(obj);
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.clone();
  if (SPEED < 0.2) { obj.position.copy(h.pos); obj.quaternion.copy(h.quat); obj.scale.copy(h.scale); return; }
  await tween(D(id === 'movement' ? 1100 : 650), (k) => { obj.position.lerpVectors(p0, h.pos, k); obj.position.y += Math.sin(k * Math.PI) * (id === 'movement' ? 18 : 7); obj.quaternion.slerpQuaternions(q0, h.quat, k); obj.scale.lerpVectors(s0, h.scale, k); });
  if (id === 'caseback' && !G.E.quartz) { const r0 = obj.rotation.y; obj.rotation.y = r0 + 1.6; await tween(D(450), (k) => { obj.rotation.y = r0 + 1.6 * (1 - k); }); }
}
function screwSlotPos(sid) { const sc = G.E.screws[sid]; const base = trayWorld(slotOf(sc.part)); return base.add(new THREE.Vector3(-6 + sc.i * 2.4, 0.2, 5.6)); }
async function fxTurn(sid, dir, prog) {
  const s = G.MV.screws[sid], obj = s.obj, h = G.home[sid];
  if (dir > 0 && obj.parent !== h.parent) { // atornillar: el tornillo viaja desde la bandeja al agujero
    obj.visible = true; h.parent.attach(obj);
    const up = h.pos.clone().add(new THREE.Vector3(0, 1.0, 0).applyQuaternion(h.quat));
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone();
    if (SPEED >= 0.2) await tween(D(450), (k) => { obj.position.lerpVectors(p0, up, k); obj.quaternion.slerpQuaternions(q0, h.quat, k); }); else { obj.position.copy(up); obj.quaternion.copy(h.quat); }
  }
  const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(h.quat);
  const target = h.pos.clone().add(axis.clone().multiplyScalar(dir > 0 ? (1 - prog) * 1.0 : prog * 0.8));
  const p0 = obj.position.clone(); const lh = G.E.screws[sid].lh ? -1 : 1;
  if (SPEED >= 0.2) await tween(D(240), (k) => { obj.position.lerpVectors(p0, target, k); obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), dir * lh * 0.09); });
  else obj.position.copy(target);
  if (floatingTool && sel === 'screwdriver') { const w = new THREE.Vector3(); obj.getWorldPosition(w); floatingTool.position.copy(w).add(new THREE.Vector3(0, 0.6, 0)); floatingTool.rotation.y += dir * 0.6; }
}
async function fxUnscrew(sid) { const obj = G.MV.screws[sid].obj; obj.getObjectByName('thread').visible = true; await moveWorld(obj, screwSlotPos(sid), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1), 600, 8); positionFloatingTool(); }
async function fxScrew(sid) { const obj = G.MV.screws[sid].obj, h = G.home[sid]; obj.getObjectByName('thread').visible = false; obj.position.copy(h.pos); positionFloatingTool(); }
async function fxLost(sid) { const obj = G.MV.screws[sid].obj; await moveWorld(obj, obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(60, -20, 50)), obj.quaternion.clone(), new THREE.Vector3(1, 1, 1), 500, 25); obj.visible = false; }
function refreshGhosts() {
  if (!G) return;
  for (const [sid, s] of Object.entries(G.MV.screws)) { const sc = G.E.screws[sid]; s.ghost.visible = G.E.st[sc.part] === 'in' && sc.state !== 'in'; }
}
async function flipWatch(to) {
  const root = G.root, r0 = root.rotation.z, r1 = to ? Math.PI : 0, y0 = root.position.y, y1 = to ? G.CS.dims.yBack : G.CS.dims.yFront;
  const cam = setView(G.E.flags.mvLoc === 'holder' ? view : (to ? 'back' : 'front'));
  if (SPEED < 0.2) { root.rotation.z = r1; root.position.y = y1; } else await tween(D(900), (k) => { root.rotation.z = r0 + (r1 - r0) * k; root.position.y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 22; });
  await cam;
}
async function flipHolder(to) {
  const mv = G.mvObj, q0 = mv.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, to === 'dial' ? Math.PI : 0));
  const pl = G.E.quartz ? 0.9 : 1.2, y0 = mv.position.y, y1 = HOLDER_POS.y + (to === 'dial' ? 8.4 + pl : 8.4);
  if (SPEED < 0.2) { mv.quaternion.copy(q1); mv.position.y = y1; return; }
  await tween(D(900), (k) => { mv.quaternion.slerpQuaternions(q0, q1, k); mv.position.y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 18; });
}
function flashLabel(t) { const l = $('#label3d'); l.innerHTML = t; l.hidden = false; clearTimeout(l._t); l._t = setTimeout(() => (l.hidden = true), 3200); }
async function faultFx(effect, on) {
  const S = G.MV.sub, f = G.E.F.id;
  if (effect === 'reveal') {
    if (f === 'aceiteSeco') { S.dirt.material.color.set(0x2a1c08); flashLabel('⚠ Aceite seco y oscurecido en el rubí'); }
    if (f === 'muelleDebil') { S.mainspring.visible = true; S.barrelDrum.material.color.set(0x6e5a44); flashLabel('⚠ Muelle real fatigado'); }
    if (f === 'ejeRoto') { S.pivot.material = S.pivot.material.clone(); S.pivot.material.color.set(0xff4444); S.pivot.material.emissive = new THREE.Color(0x550000); flashLabel('⚠ Pivote del eje roto'); }
    if (f === 'bobina') { S.coilMat.color.set(0x5a2e14); flashLabel('⚠ Bobina cortada (∞ Ω)'); }
    if (f === 'bateria') flashLabel('🔋 1,21 V · agotada');
  }
  if (effect === 'openSpring' && S.spring) { const s = S.spring; await tween(D(450), (k) => { s.rotation.y = -0.9 * k; s.position.x = -0.5 * k; }); }
  if (effect === 'clean' && S.dirt) { await tween(D(450), (k) => S.dirt.scale.setScalar(1 - k * 0.99)); S.dirt.visible = false; flashLabel('Rubí limpio'); }
  if (effect === 'oil') { if (f === 'aceiteSeco') { S.oil.visible = true; S.oil.scale.setScalar(0.01); await tween(D(450), (k) => S.oil.scale.setScalar(Math.max(0.01, k))); if (S.spring) { S.spring.rotation.y = 0; S.spring.position.x = 0; } flashLabel('✓ Gota de 9010 centrada'); } else flashLabel('✓ Lubricado'); }
  if (effect === 'replace') { if (f === 'ejeRoto') { S.pivot.rotation.z = 0; S.pivot.position.x = 0; S.pivot.material = G.MV.sub.staff.material; } if (f === 'muelleDebil') { S.mainspring.material.color.set(0xc7ccd3); S.barrelDrum.material.color.set(0xd4d9df); } flashLabel('✓ Pieza nueva'); }
  if (effect === 'regulate' && S.regulator) { const r0 = S.regulator.rotation.y; await tween(D(500), (k) => (S.regulator.rotation.y = r0 + (0.4 - r0) * k)); flashLabel('Raqueta → «−»'); }
  if (effect === 'demag') flashLabel('🧲 Desmagnetizado');
}
async function runFx(list) {
  for (const f of list) {
    if (f.fx === 'remove') { await fxRemove(f.part, f.inspect); if (f.inspect) await setView('mat'); }
    else if (f.fx === 'install') { await fxInstall(f.part); if (f.part === 'battery' && G.E.replaced.has('battery')) flashLabel('🔋 Pila nueva SR626SW'); if (f.part === 'coil' && G.E.replaced.has('coil')) G.MV.sub.coilMat.color.set(0xd88a4a); }
    else if (f.fx === 'turn') await fxTurn(f.screw, f.dir, f.prog);
    else if (f.fx === 'unscrew') await fxUnscrew(f.screw);
    else if (f.fx === 'screw') await fxScrew(f.screw);
    else if (f.fx === 'lost') await fxLost(f.screw);
    else if (f.fx === 'slip') { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
    else if (f.fx === 'flipWatch') await flipWatch(f.to);
    else if (f.fx === 'flipHolder') await flipHolder(f.to);
    else if (f.fx === 'protector') G.MV.protector.visible = f.on;
    else if (f.fx === 'fault') await faultFx(f.effect, f.on);
    else if (f.fx === 'fixed') flashLabel('✅ Falla reparada');
    else if (f.fx === 'oil') flashLabel('🛢 Lubricado');
    else if (f.fx === 'zoom') { if (f.part && G.parts[f.part]) { loupeTarget = partWorldCenter(G.parts[f.part]); await setView('loupe'); } }
    else if (f.fx === 'compass') { if (floatingTool) { const n = floatingTool.getObjectByName('needle'); if (n) { const r0 = n.rotation.y; await tween(D(900), (k) => (n.rotation.y = r0 + (f.mag ? Math.sin(k * 12) * 2.5 : Math.sin(k * 6) * 0.05))); } } }
    else if (f.fx === 'tg') await showTG(f.reading);
    else if (f.fx === 'wind') { const r = G.parts.ratchet; if (r && SPEED >= 0.2) { const r0 = r.rotation.y; await tween(D(700), (k) => (r.rotation.y = r0 - k * 4)); } }
    else if (f.fx === 'finish') finish();
  }
}

// ───────── UI: herramientas, tamaños de punta, bandeja ─────────
const toolsEl = $('#tools');
TOOLS.forEach(t => {
  const b = document.createElement('button'); b.className = 'tool'; b.dataset.tool = t.id;
  b.innerHTML = `<img class="stamp" alt=""><svg viewBox="0 0 32 32">${ICONS[t.id] || ''}</svg><span>${t.short || t.name}</span>`;
  b.onclick = () => selectTool(sel === t.id ? null : t.id, true); toolsEl.appendChild(b);
});
const sizesEl = $('#sizes');
SCREWDRIVER_SIZES.forEach(s => { const b = document.createElement('button'); b.className = 'size'; b.dataset.size = s; b.textContent = s.toFixed(1).replace('.', ','); b.onclick = () => setSize(s); sizesEl.appendChild(b); });
function setSize(s) { size = s; document.querySelectorAll('.size').forEach(b => b.classList.toggle('on', +b.dataset.size === s)); if (T && T.models.screwdriver.userData.setSize) T.models.screwdriver.userData.setSize(s); }
function selectTool(id, talk = false) {
  if (!started || busy) return; sel = id;
  document.querySelectorAll('.tool').forEach(b => { b.classList.toggle('sel', b.dataset.tool === sel); b.classList.remove('hint'); });
  sizesEl.hidden = sel !== 'screwdriver'; showFloatingTool();
  if (sel && talk) { const t = TOOLS.find(x => x.id === sel); say(`<b>${t.name}:</b> ${t.desc}<br><span class="small">Ahora toca la pieza${sel === 'screwdriver' ? ' o el tornillo' : ''} donde la quieres usar.</span>`); }
}
function showFloatingTool() { toolGroup.clear(); floatingTool = null; if (!sel || !T || !T.models[sel]) return; floatingTool = T.models[sel]; toolGroup.add(floatingTool); if (sel === 'screwdriver') T.models.screwdriver.userData.setSize(size); positionFloatingTool(); }
function positionFloatingTool() {
  if (!floatingTool) return; floatingTool.visible = view !== 'tray' && view !== 'tg'; const cfg = VIEWS[view] ? VIEWS[view]() : VIEWS.front(); const s = Math.min(cfg.size, 40) / 60;
  floatingTool.scale.setScalar(s);
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  floatingTool.position.copy(controls.target).add(right.multiplyScalar(cfg.size * 0.36)).add(new THREE.Vector3(0, cfg.size * 0.25, -cfg.size * 0.1));
  floatingTool.userData.base = floatingTool.position.clone();
}
function renderTray() {
  const el = $('#tray'); el.innerHTML = ''; if (!G) return;
  const E = G.E;
  for (const id of E.history.slice().reverse()) {
    if (id === 'movement' || E.st[id] !== 'out') continue;
    const c = document.createElement('button'); c.className = 'chip'; c.dataset.chip = id;
    const nm = E.name(id).replace(/^(el|la|las|los) /, ''); const pend = E.P[id].oil && E.P[id].oil.when === 'before' && !E.oiled.has(id);
    c.innerHTML = `${nm}${E.replaced.has(id) ? ' <i>nueva</i>' : ''}${pend ? ' 🛢?' : ''}`; c.onclick = () => chipTap(id); el.appendChild(c);
  }
  const groups = {};
  for (const sc of Object.values(E.screws)) if (sc.state !== 'in') { (groups[sc.part] = groups[sc.part] || []).push(sc); }
  for (const [pid, list] of Object.entries(groups)) {
    const c = document.createElement('button'); c.className = 'chip screw' + (E.armed === pid ? ' armed' : ''); c.dataset.screws = pid;
    const lost = list.filter(s => s.state === 'lost').length;
    c.innerHTML = `🔩 ${E.name(pid).replace(/^(el|la|las|los) /, '').split(' (')[0]} ×${list.length} · ${list[0].s.toFixed(1).replace('.', ',')}${lost ? ` <i>${lost} perdido</i>` : ''}`;
    c.onclick = () => { if (busy) return; if (sel !== 'screwdriver') { say('Elige el <b>destornillador</b> y luego toca el grupo de tornillos para cargarlos en la punta.'); return; } act(E.tapChip(pid, 'screwdriver', size)); };
    el.appendChild(c);
  }
}
function updateBar() {
  if (!G) return; const g = G.E.goal();
  $('#steptxt').textContent = G.E.finished ? '¡Trabajo terminado!' : g.text; $('#phase').textContent = g.phase;
  $('#progress i').style.width = (G.E.progress() * 100).toFixed(0) + '%';
  $('#score').textContent = '★ ' + G.E.score;
  const btn = $('#actionBtn'), E = G.E;
  const canWind = !E.quartz && E.flags.letdown && E.C.parts.filter(p => p.side !== 'case').every(p => E.st[p.id] === 'in');
  btn.hidden = !canWind; btn.textContent = '⚙️ Dar cuerda';
  updateFlipBtn();
}
function updateFlipBtn() {
  const f = $('#flipBtn'); if (!G) { f.hidden = true; return; }
  f.hidden = !(view === 'front' || view === 'back' || (view === 'holder' && G.E.flags.mvLoc === 'holder'));
  f.textContent = view === 'holder' ? '↻ Voltear movimiento' : '↻ Voltear reloj';
}
function say(html, kind) { const m = $('#msg'); m.innerHTML = html; m.className = kind || ''; }
function refresh() { refreshGhosts(); renderTray(); updateBar(); }

// ───────── acciones ─────────
async function act(r, opts = {}) {
  if (!r) return;
  if (r.msg) say(r.msg, r.kind === 'bad' ? 'bad' : r.kind === 'good' ? 'good' : '');
  if (r.kind === 'bad' && !r.fx.length) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
  busy = true;
  try { await runFx(r.fx); } finally { busy = false; }
  refresh();
  if (!opts.keepView && r.fx.some(f => ['remove', 'install', 'flipHolder', 'flipWatch'].includes(f.fx)) && !r.fx.some(f => f.fx === 'remove' && f.inspect)) { const v = workView(); if (view !== v && view !== 'tray') await setView(v); }
}
function resolveTarget(chain) {
  const E = G.E, s = E.F.steps[E.fstep];
  if (s && !s.removed && chain.includes(s.on)) return s.on;
  // Palancas de agujas: actúan sobre la pila de agujas del centro → siempre la aguja superior que siga puesta
  const HANDS = ['secHand', 'minHand', 'hourHand'];
  if (sel === 'handLevers' && E.flags.mvLoc === 'holder' && E.flags.holderSide === 'dial' && chain.some(id => HANDS.includes(id) || id === 'dial' || id === 'movement')) { const top = HANDS.find(h => E.st[h] === 'in'); if (top) return top; }
  for (const id of chain) { if (SUBS.includes(id)) continue; if (id === 'movement' && E.flags.mvLoc === 'holder' && ['handLevers', 'handPress', 'dialProtector'].includes(sel)) return chain.includes('dial') ? 'dial' : 'dial'; if (id === 'watch' || E.P[id]) return id; }
  return chain[0];
}
async function handleTap(hit) {
  if (!started || busy || !G) return;
  if (hit.screw || hit.ghost) {
    if (sel !== 'screwdriver') { await act(G.E.screwTurn(hit.screw || hit.ghost, sel, size, 0)); return; }
    await turnScrew(hit.screw || hit.ghost, 0.34); return;
  }
  // El protector cubre toda la esfera: con el movimiento en el soporte (lado esfera), cualquier toque lo pone/quita
  if (sel === 'dialProtector' && G.E.flags.mvLoc === 'holder' && G.E.flags.holderSide === 'dial' && G.E.st.dial === 'in' && !(hit.chain || []).some(c => c === 'timegrapher3d' || c === 'holderBench')) { await act(G.E.tapPart('dial', 'dialProtector', size)); return; }
  if (!hit.chain.length) return;
  const id = resolveTarget(hit.chain);
  if (id === 'timegrapher3d') { if (sel === 'timegrapher') await act(G.E.tapPart('watch', sel, size)); else say('El timegrapher LA FORY: elige la herramienta <b>Timegrapher</b> y toca el reloj.'); return; }
  if (id === 'holderBench') { say('El soporte de movimiento. Usa la herramienta <b>Soporte</b> sobre el movimiento para pasarlo aquí.'); return; }
  const E = G.E;
  if (E.P[id] && E.st[id] === 'out') await act(E.tapChip(id, sel, size));
  else await act(E.tapPart(id, sel, size));
}
async function chipTap(id) { if (!started || busy) return; await act(G.E.tapChip(id, sel, size)); }
async function turnScrew(sid, amount) { const r = G.E.screwTurn(sid, sel, size, amount); await act(r, { keepView: true }); return r; }
// ── teclado (escritorio / iPad con teclado) ──
window.addEventListener('keydown', (e) => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'Escape') { if (!$('#bqDetail').hidden) $('#bqBack').click(); else if (!$('#boutique').hidden) $('#bqClose').click(); else if (!$('#tgPanel').hidden) { if (!$('#tgClose').disabled) $('#tgClose').click(); } else if (started) openMenu(); else if (G && G.active && $('#endOverlay').hidden) { $('#intro').hidden = true; started = true; } return; }
  if (!started || !G) return;
  if (e.shiftKey && (e.key === 'F' || e.key === 'f')) { toggleFullscreen(); e.preventDefault(); return; }
  if (e.key === 'f' || e.key === 'F') { if (!$('#flipBtn').hidden) $('#flipBtn').click(); return; }
  if (e.key === 'h' || e.key === 'H') { $('#hintBtn').click(); return; }
  if (e.key === 'w' || e.key === 'W') { if (!$('#actionBtn').hidden) $('#actionBtn').click(); return; }
  if (/^[1-9]$/.test(e.key)) { const t = TOOLS[+e.key - 1 + (e.altKey ? 9 : 0)]; if (t) selectTool(sel === t.id ? null : t.id, true); return; }
  if (e.key === '0') { const t = TOOLS[9]; if (t) selectTool(sel === t.id ? null : t.id, true); return; }
  if ((e.key === '+' || e.key === ']' || e.key === '-' || e.key === '[') && sel === 'screwdriver') { const i = SCREWDRIVER_SIZES.indexOf(size) + (e.key === '+' || e.key === ']' ? 1 : -1); if (SCREWDRIVER_SIZES[i]) setSize(SCREWDRIVER_SIZES[i]); return; }
  const vk = { r: 'watch', s: 'holder', b: 'tray', a: 'mat' }[e.key.toLowerCase()]; if (vk) document.querySelector(`.vbtn[data-view="${vk}"]`).click();
});
// ── pantalla completa (Fullscreen API con prefijos webkit; en iPad Safari → PWA «Agregar a pantalla de inicio») ──
const fsEl = document.documentElement;
const fsSupported = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
function toggleFullscreen() {
  if (!fsSupported) { const h = $('#a2hs'); h.hidden = false; clearTimeout(h._t); h._t = setTimeout(() => (h.hidden = true), 7000); return; }
  try { if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const r = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); if (r && r.catch) r.catch(() => {}); } } catch (err) { /* ignorado */ }
}
function updateFsBtn() { document.querySelectorAll('.fsBtn').forEach(b => { b.classList.toggle('on', isFs()); b.title = isFs() ? 'Salir de pantalla completa (Shift+F)' : 'Pantalla completa (Shift+F)'; b.hidden = standalone(); }); }
document.querySelectorAll('.fsBtn').forEach(b => (b.onclick = toggleFullscreen));
document.addEventListener('fullscreenchange', updateFsBtn); document.addEventListener('webkitfullscreenchange', updateFsBtn); updateFsBtn();
if ($('#a2hsClose')) $('#a2hsClose').onclick = () => ($('#a2hs').hidden = true);
$('#actionBtn').onclick = async () => { if (!busy && G) await act(G.E.button('wind')); };
$('#flipBtn').onclick = async () => { if (busy || !G) return; await act(G.E.button(view === 'holder' ? 'flipHolder' : 'flipWatch'), { keepView: true }); };
document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => { if (busy || !G) return; const v = b.dataset.view; setView(v === 'watch' ? (G.E.flags.flipped ? 'back' : 'front') : v); });
$('#hintBtn').onclick = () => {
  if (!started || busy || !G) return; const h = G.E.hint(); say(h.msg); updateBar(); const a = h.action; if (!a) return;
  if (a.tool) { document.querySelectorAll('.tool').forEach(b => b.classList.toggle('hint', b.dataset.tool === a.tool)); if (a.size) document.querySelectorAll('.size').forEach(b => b.classList.toggle('hint', +b.dataset.size === a.size)); }
  if (a.target && a.target.chip) { const c = document.querySelector(`.chip[data-chip="${a.target.chip}"]`); if (c) c.classList.add('hint'); }
  const obj = a.target && (a.target.screw ? G.MV.screws[a.target.screw].obj : G.parts[a.target.part || a.target.sub]);
  if (obj && a.target.part !== 'movement') highlight(obj);
};
function highlight(obj) {
  const mats = []; obj.traverse(o => { if (o.isMesh && !o.userData.isHit && o.material && o.material.emissive) { const m = o.material.clone(); o.material = m; mats.push([o, m]); } });
  tween(1600, (k, raw) => { const v = Math.abs(Math.sin(raw * Math.PI * 4)) * 0.6; mats.forEach(([, m]) => m.emissive.setRGB(v, v * 0.8, v * 0.3)); }).then(() => mats.forEach(([, m]) => m.emissive.setRGB(0, 0, 0)));
}

// ───────── timegrapher ─────────
async function showTG(v) {
  const prev = view; T.tgScreen.boot(); await setView('tg');
  const warn = v.none || (v.amp && v.amp < 250) || Math.abs(v.rate || 0) > 15 ? 'warn' : '';
  $('#tgVals').innerHTML = v.none ? `<div class="warn">Marcha<b>—</b>s/día</div><div class="warn">Amplitud<b>—</b></div><div>Error<b>—</b>ms</div><div>Señal<b>NO</b></div>`
    : v.quartz ? `<div>Marcha<b>+${v.rate}</b>s/día</div><div>Impulsos<b>1</b>/s</div><div>Modo<b>QZ</b></div><div>Pila<b>OK</b></div>`
    : `<div class="${warn}">Marcha<b>${v.rate > 0 ? '+' : ''}${v.rate}</b>s/día</div><div class="${v.amp < 250 ? 'warn' : ''}">Amplitud<b>${v.amp}°</b></div><div>Error<b>${v.be.toFixed(1)}</b>ms</div><div>Levée<b>50°</b>4 Hz</div>`;
  $('#tgNote').innerHTML = v.note || ''; $('#tgTitle').textContent = 'LA FORY TG-1 · arrancando…';
  $('#tgPanel').hidden = false; $('#tgClose').disabled = true;
  await sleep(D(1000)); T.tgScreen.trace(v); $('#tgTitle').textContent = 'Timegrapher LA FORY TG-1'; $('#tgClose').disabled = false;
  await new Promise(res => { $('#tgClose').onclick = () => { $('#tgPanel').hidden = true; res(); }; });
  await setView(prev === 'tg' || prev === 'loupe' ? workView() : prev);
}

// ───────── toque / mantener (raycast) ─────────
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null, hold = null;
const visibleChain = (o) => { if (o.userData.noPick) return false; for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };
function pick(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(scene.children.filter(o => o !== toolGroup), true).filter(h => visibleChain(h.object));
  const firstD = hits.length ? hits[0].distance : 0;
  for (const h of hits.slice(0, 8)) { if (h.distance - firstD > 8) break; for (let n = h.object; n; n = n.parent) { if (n.userData.screwId) return { screw: n.userData.screwId }; if (n.userData.screwGhost) return { ghost: n.userData.screwGhost }; } }
  for (const h of hits) { const chain = []; for (let n = h.object; n; n = n.parent) if (n.userData.partId) chain.push(n.userData.partId); if (chain.length) return { chain }; if (!h.object.userData.isHit) return { chain: [] }; }
  return { chain: [] };
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button > 0) return; // botón derecho/central = desplazar con OrbitControls
  clearHover();
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (started && !busy && G && sel === 'screwdriver') {
    const h = pick(e.clientX, e.clientY); const sid = h.screw || h.ghost;
    if (sid) { controls.enabled = false; hold = { sid, turned: 0, timer: setTimeout(function loopTurn() { if (!hold) return; turnScrew(sid, 0.34).then(r => { if (!hold) return; hold.turned++; if (r.kind === 'turn') hold.timer = setTimeout(loopTurn, 60); else { hold.done = true; } }); }, 280) }; }
  }
});
// ── hover con ratón: resalta tornillo o pieza bajo el cursor ──
let hovered = null, hoverT = 0; const hoverMats = new Map();
function clearHover() { for (const [m, orig] of hoverMats) m.material = orig; hoverMats.clear(); hovered = null; renderer.domElement.style.cursor = ''; }
function setHover(obj) {
  if (obj === hovered) return; clearHover(); if (obj === 'watch') return; if (!obj) return; hovered = obj; renderer.domElement.style.cursor = 'pointer';
  obj.traverse(o => { if (o.isMesh && !o.userData.isHit && o.material && o.material.emissive && !Array.isArray(o.material)) { const c = o.material.clone(); c.emissive = new THREE.Color(0x5a4210); c.emissiveIntensity = 1; hoverMats.set(o, o.material); o.material = c; } });
}
function hoverAt(x, y) {
  if (!G || !started || busy) return clearHover(); const h = pick(x, y);
  if (h.screw) return setHover(G.MV.screws[h.screw].obj); if (h.ghost) return setHover(G.MV.screws[h.ghost].ghost);
  const id = h.chain && h.chain.length ? resolveTarget(h.chain) : null;
  if (id === 'watch') { if (hovered !== 'watch') { clearHover(); hovered = 'watch'; renderer.domElement.style.cursor = 'pointer'; } return; }
  const o = id ? (G.parts[id] || (G.MV.sub && G.MV.sub[id])) : null;
  setHover(o && o !== G.mvObj ? o : null);
}
renderer.domElement.addEventListener('pointerleave', clearHover);
renderer.domElement.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !down && e.buttons === 0) { const n = performance.now(); if (n - hoverT > 90) { hoverT = n; hoverAt(e.clientX, e.clientY); } } });
renderer.domElement.addEventListener('pointermove', (e) => { if (hold && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) { clearTimeout(hold.timer); hold = null; controls.enabled = true; } });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (hold) { const h = hold; hold = null; clearTimeout(h.timer); controls.enabled = true; if (!h.turned && !h.done) handleTap({ screw: h.sid }); down = null; return; }
  if (!down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (d > 10 || dt > 650) return; handleTap(pick(e.clientX, e.clientY));
});

// ───────── fin ─────────
function finish() {
  const E = G.E, e = Math.floor((Date.now() - t0) / 1000), s = E.stats, score = E.score;
  const nS = score >= 90 ? 3 : score >= 70 ? 2 : 1, stars = '★'.repeat(nS) + '<i>' + '★'.repeat(3 - nS) + '</i>';
  if (mode === 'story' && storyCase) { const i = STORY.findIndex(c => c.id === storyCase.id); const done = +(localStorage.getItem('zarumei.story') || 0); if (i + 1 > done) localStorage.setItem('zarumei.story', String(i + 1)); }
  const next = mode === 'story' && storyCase ? STORY[STORY.findIndex(c => c.id === storyCase.id) + 1] : null;
  const pay = E.F.free ? 150 + score * 2 : 400 + score * 8; wallet.add(pay);
  $('#endCard').innerHTML = `<div class="cert"><small class="cinzel">Maison LA FORY · Certificado de servicio</small>
  <h2 class="foil">${E.F.free ? 'Práctica completada' : 'Reloj reparado'}</h2><div class="stars">${stars}</div>
  <p class="serif"><b>${E.W.name}</b><br><i>${E.F.name}</i></p><hr class="goldrule">
  <div class="kv"><span>Puntos</span><b>${score}</b><span>Tiempo</span><b>${Math.floor(e / 60)}:${String(e % 60).padStart(2, '0')}</b><span>Errores</span><b>${s.errors}</b><span>Orden / herramienta</span><b>${s.wrongOrder} / ${s.wrongTool}</b><span>Tornillos dañados · perdidos</span><b>${s.slips} · ${s.lost}</b><span>Tornillos equivocados · repuestos</span><b>${s.wrongScrews} · ${s.spares}</b><span>Pistas</span><b>${s.hints}</b></div>
  <hr class="goldrule"><p class="cinzel small">Lo que aprendiste</p><ul>${E.F.lessons.map(l => `<li>${l}</li>`).join('')}</ul>
  <div class="shop"><img src="${images.logo.src}" alt="LA FORY"><div><small class="cinzel">Honorarios cobrados</small><b class="price big">${fmtPrice(pay)}</b><span class="small">Saldo del taller: ${fmtPrice(wallet.balance)}</span></div></div>
  <div class="row"><button class="lux" id="menuBtn">Menú</button><button class="lux" data-open="boutique" id="endShop">Boutique</button>${next ? `<button class="lux primary" id="nextBtn">Siguiente caso</button>` : ''}</div></div>`;
  $('#endShop').onclick = () => openBoutique();
  $('#endOverlay').hidden = false;
  $('#menuBtn').onclick = () => { $('#endOverlay').hidden = true; openMenu(); };
  if (next) $('#nextBtn').onclick = () => { $('#endOverlay').hidden = true; startStory(next.id); };
}

// ───────── menú: Historia / Libre ─────────
function openMenu() { started = false; $('#intro').hidden = false; renderMenu(); }
function renderMenu() {
  const done = +(localStorage.getItem('zarumei.story') || 0);
  const list = $('#caseList'); list.innerHTML = '';
  STORY.forEach((c, i) => {
    const W = WATCHES[c.watch], F = FAULTS[c.fault], locked = i > done;
    const b = document.createElement('button'); b.className = 'casecard' + (locked ? ' locked' : ''); b.dataset.case = c.id;
    b.innerHTML = `<b>${locked ? '🔒 ' : ''}${c.title}</b><span>${W.name} · ${CALIBERS[W.caliber].name}</span><div class="ticket">CLIENTE: ${c.cliente}<br>RELOJ: ${W.name}<br>CALIBRE: ${CALIBERS[W.caliber].name} (${CALIBERS[W.caliber].type === 'auto' ? 'automático' : 'cuarzo'})<br>QUEJA: <b>${F.symptom}</b></div>`;
    b.onclick = () => { if (locked) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; } startStory(c.id); }; list.appendChild(b);
  });
  const wl = $('#watchList'); wl.innerHTML = '';
  Object.values(WATCHES).forEach(w => { const b = document.createElement('button'); b.className = 'wcard' + (playWatch === w.id ? ' on' : ''); b.dataset.watch = w.id; b.innerHTML = `<b>${w.name}</b><span>${w.blurb}</span><small>${CALIBERS[w.caliber].name} · ${CALIBERS[w.caliber].desc}</small>`; b.onclick = () => { playWatch = w.id; renderMenu(); }; wl.appendChild(b); });
  const fl = $('#faultList'); fl.innerHTML = ''; const type = CALIBERS[WATCHES[playWatch].caliber].type;
  if (!FAULTS[playFault].calibers.includes(type)) playFault = 'sinFalla';
  Object.values(FAULTS).filter(f => f.calibers.includes(type)).forEach(f => { const b = document.createElement('button'); b.className = 'fchip' + (playFault === f.id ? ' on' : ''); b.dataset.fault = f.id; b.textContent = f.name; b.onclick = () => { playFault = f.id; renderMenu(); }; fl.appendChild(b); });
}
let playWatch = 'miami', playFault = 'sinFalla';
document.querySelectorAll('.tab').forEach(t => t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); $('#storyPane').hidden = t.dataset.tab !== 'story'; $('#playPane').hidden = t.dataset.tab !== 'play'; });
$('#playBtn').onclick = () => startPlay(playWatch, playFault);
async function begin(watchId, faultId, story) {
  buildWorld(watchId, faultId, story); G.active = true;
  sel = null; selectTool(null); started = true; busy = false; t0 = Date.now(); $('#timer')._t0 = Date.now();
  $('#intro').hidden = true; $('#endOverlay').hidden = true; resize(); await setView('front', true); refresh();
  const W = WATCHES[watchId], F = FAULTS[faultId];
  say(story ? `<b>${story.title}</b> — ${W.name}. ${story.intro}` : `<b>Modo libre</b> — ${W.name} · ${F.name}. ${F.free ? 'Desarma lo que quieras y vuelve a montarlo todo.' : 'Diagnostica, repara, monta y prueba.'}`);
}
function startStory(id) { mode = 'story'; storyCase = STORY.find(c => c.id === id); return begin(storyCase.watch, storyCase.fault, storyCase); }
function startPlay(w, f) { mode = 'play'; storyCase = null; return begin(w, f, null); }

async function init() {
  images = await loadAllImages(); M = makeMaterials(); initBoutique({ M, images });
  document.querySelectorAll('[data-open="boutique"]').forEach(b => b.onclick = () => openBoutique());
  try { await Promise.all(['600 20px Cinzel', '500 20px "Cormorant Garamond"', '400 14px Jost'].map(f => document.fonts.load(f))); } catch (e) { /* fuentes de reserva */ }
  // banco de ónix, tapete de cuero con pespunte dorado y alfombrilla de terciopelo verde
  const bench = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: onyxTexture(), roughness: 0.32, metalness: 0.1 })); bench.rotation.x = -Math.PI / 2; bench.position.y = -0.2; bench.receiveShadow = true; scene.add(bench);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(220, 1.2, 170), [0, 0, 1, 0, 0, 0].map(i => i ? new THREE.MeshStandardMaterial({ map: leatherTexture(images.logo), roughness: 0.62, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.7 }))); mat.position.set(-6, -0.6, 6); mat.receiveShadow = true; scene.add(mat);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(222, 0.6, 172), new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 1, roughness: 0.28 })); rim.position.set(-6, -0.9, 6); scene.add(rim);
  const insp = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.5, 40), new THREE.MeshStandardMaterial({ map: velvetTexture('#0e2a21'), roughness: 1 })); insp.position.copy(INSPECT_POS).add(new THREE.Vector3(0, -0.3, 0)); insp.receiveShadow = true; scene.add(insp);
  $('#introLogo').src = images.logo.src; $('#bqLogo').src = images.logo.src; $('#headLogo').src = images.badge.src; $('#toolheadLogo').src = images.logo.src;
  document.querySelectorAll('.tool .stamp').forEach(i => (i.src = images.badge.src));
  buildWorld('miami', 'aceiteSeco', null); setSize(1.0);
  renderMenu(); resize(); await setView('front', true);
  $('#loading').hidden = true; requestAnimationFrame(loop);
}

// ───────── bucle ─────────
const clock = new THREE.Clock(); let frames = 0, fpsT = performance.now(), fps = 0;
function loop(now) {
  runTweens(now);
  const t = clock.getElapsedTime();
  if (G) {
    const E = G.E, run = E.running(), P = G.parts;
    const d = new Date(); const quartz = E.quartz;
    const sec = quartz ? d.getSeconds() : d.getSeconds() + Math.floor(d.getMilliseconds() / 125) / 8, mn = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + mn / 60;
    if (run) { for (const [id, v] of [['secHand', sec / 60], ['minHand', mn / 60], ['hourHand', hr / 12]]) { const r = P[id] && P[id].getObjectByName('rot'); if (r && E.st[id] === 'in') r.rotation.y = -v * Math.PI * 2; } }
    if (G.MV.wheel) { const amp = run ? THREE.MathUtils.degToRad(E.amplitude()) : 0; G.MV.wheel.rotation.y = run ? amp * Math.sin(t * Math.PI * 8) : G.MV.wheel.rotation.y * 0.92; }
    if (run && P.escapeWheel) P.escapeWheel.rotation.y = -Math.floor(t * 8) * (Math.PI * 2 / 20) / 2;
    if (run && quartz && P.stepRotor) P.stepRotor.rotation.y = d.getSeconds() * Math.PI;
  }
  if (floatingTool && floatingTool.userData.base && !tweens.length && !hold) { floatingTool.rotation.y = t * 0.6; floatingTool.position.y = floatingTool.userData.base.y + Math.sin(t * 2) * 0.4; }
  controls.update(); renderer.render(scene, camera);
  frames++; if (now - fpsT > 1000) { fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now; }
  requestAnimationFrame(loop);
}

// ───────── API de pruebas (Playwright) ─────────
function screenOfObj(o, dy = 0) { const p = new THREE.Vector3(); let hp = null; o.traverse(c => { if (!hp && c.userData.isHit && visibleChain(c)) hp = c; }); (hp || o).getWorldPosition(p); p.y += dy; p.project(camera); const r = renderer.domElement.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; }
window.__game = {
  get started() { return started; }, get busy() { return busy || !!tweens.length; }, get view() { return view; }, get fps() { return fps; },
  get state() { if (!G) return null; const E = G.E; return { watch: E.W.id, fault: E.F.id, score: E.score, finished: E.finished, goal: E.goal(), flags: { ...E.flags }, stats: { ...E.stats }, out: Object.keys(E.st).filter(k => E.st[k] === 'out'), screwsOut: Object.values(E.screws).filter(s => s.state !== 'in').length, fstep: E.fstep }; },
  get info() { const i = renderer.info.render; return { calls: i.calls, triangles: i.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
  startStory, startPlay, setSpeed: (s) => (SPEED = s), setView: (v) => setView(v),
  selectTool: (id) => selectTool(id), setSize,
  suggest: () => G.E.suggest(), describe: (a) => G.E.describe(a),
  // ejecuta una acción como la haría el jugador (misma ruta de código que los toques)
  async do(a) {
    if (a.button) { if (a.button === 'wind') $('#actionBtn').click(); else { await setView(a.button === 'flipHolder' ? 'holder' : workView()); $('#flipBtn').click(); } return; }
    if (a.tool !== sel) selectTool(a.tool); if (a.size) setSize(a.size);
    if (a.target.screw) { let r; do { r = await turnScrew(a.target.screw, 0.34); } while (r.kind === 'turn'); return; }
    if (a.target.chip) return chipTap(a.target.chip);
    const id = a.target.sub || a.target.part; return handleTap(id === 'watch' ? { chain: ['watch'] } : { chain: a.target.sub ? [a.target.sub, a.target.part] : [id] });
  },
  screenOf(target) {
    if (target.screw) { const s = G.MV.screws[target.screw]; return screenOfObj(G.E.screws[target.screw].state === 'in' ? s.obj : s.ghost); }
    if (target.chip) { const c = document.querySelector(`.chip[data-chip="${target.chip}"]`); if (!c) return null; c.scrollIntoView({ inline: 'center' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, chip: true }; }
    const id = target.sub || target.part; const o = id === 'watch' ? G.root : (G.parts[id] || (G.MV.sub && G.MV.sub[id])); if (!o) return null; return screenOfObj(o, id === 'jewel' ? 0.1 : 0);
  },
  pick: (x, y) => pick(x, y), workView, hoverAt, get hovered() { return hovered === 'watch' ? 'watch' : hovered ? 'part' : null; }, get dpr() { return renderer.getPixelRatio(); }, fsSupported, toggleFullscreen, get glOK() { return !!renderer.getContext(); }
};
init().catch(err => { console.error(err); $('#loading').textContent = 'Error al cargar: ' + err.message; });
