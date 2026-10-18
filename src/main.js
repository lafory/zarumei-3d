// ZARUMEI · Taller de Relojería 3D — LA FURY Tools & Jewelry
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TOOLS, PARTS, CASES } from './cases.js';
import { loadAllImages, woodTexture, matTexture } from './textures.js';
import { makeMaterials, buildWatch } from './watch.js';
import { makeTools } from './tools3d.js';
import { ICONS } from './icons.js';

const $ = (s) => document.querySelector(s);
const stage = $('#stage');

// ───────── Tweens mínimos ─────────
const tweens = [];
const ease = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function tween(dur, update, done) { return new Promise(res => tweens.push({ t0: performance.now(), dur, update, done: () => { done && done(); res(); } })); }
function runTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i], k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.update(ease(k), k);
    if (k >= 1) { tweens.splice(i, 1); tw.done(); }
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ───────── Renderer / escena ─────────
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a120b);
scene.fog = new THREE.Fog(0x1a120b, 260, 520);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, 1, 1, 1500);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.maxPolarAngle = 1.25; controls.minPolarAngle = 0.05;
controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.9;

scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a0e, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(60, 140, 80); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 10, far: 400 }); sun.shadow.bias = -0.0005;
scene.add(sun);
const lamp = new THREE.PointLight(0xffd59a, 1.2, 0, 0); lamp.position.set(-40, 90, 40); scene.add(lamp);

// ───────── Estado ─────────
let W, M, T, images;
let CASE = null, cur = 0, score = 100, errors = 0, hints = 0, sel = null, view = 'front', started = false, t0 = 0, demagUsed = false, busy = false;
let amp = 188, running = true, oiledState = 'dirty';
const done = new Set(), removed = [], removedSet = new Set();
let STEP_OF = {};
const HOLDER_POS = new THREE.Vector3(-62, 0, 14), INSPECT_POS = new THREE.Vector3(-36, 0.6, 58), TG_POS = new THREE.Vector3(92, 0, -48);
const WATCH_Y_FRONT = 5.8, WATCH_Y_BACK = 3.9;
const toolGroup = new THREE.Group(); scene.add(toolGroup);
let floatingTool = null;

// ───────── Vistas de cámara ─────────
const VIEWS = {
  front: () => ({ target: new THREE.Vector3(0, 4, 4), size: 50, dir: new THREE.Vector3(0, 1, 0.5) }),
  back: () => ({ target: new THREE.Vector3(0, 3, 2), size: 44, dir: new THREE.Vector3(0, 1, 0.5) }),
  holder: () => ({ target: HOLDER_POS.clone().add(new THREE.Vector3(0, 10, 0)), size: 30, dir: new THREE.Vector3(0, 1, 0.45) }),
  zoom: () => ({ target: INSPECT_POS.clone().add(new THREE.Vector3(0, 2.6, 0)), size: 8.5, dir: new THREE.Vector3(0, 1, 0.42) }),
  tg: () => { const c = new THREE.Vector3(), n = new THREE.Vector3(0, 0, 1); T.screen.getWorldPosition(c); n.applyQuaternion(T.screen.getWorldQuaternion(new THREE.Quaternion())); return { target: c.add(new THREE.Vector3(-6, -2, 0)), size: 62, dir: n.add(new THREE.Vector3(0, 0.35, 0)) }; }
};
function fitDistance(size) {
  const v = THREE.MathUtils.degToRad(camera.fov) / 2;
  return Math.max((size / 2) / Math.tan(v), (size / 2) / (Math.tan(v) * camera.aspect)) * 1.05;
}
async function setView(v, instant = false) {
  view = v === 'back' ? 'back' : v;
  const cfg = VIEWS[v](); const dist = fitDistance(cfg.size);
  const toPos = cfg.target.clone().add(cfg.dir.clone().normalize().multiplyScalar(dist));
  controls.minDistance = dist * 0.3; controls.maxDistance = dist * 2.4;
  $('#viewtag').textContent = 'Vista: ' + ({ front: 'esfera', back: 'fondo / movimiento', holder: 'movimiento en soporte', zoom: 'lupa x10 · amortiguador', tg: 'timegrapher' })[v];
  $('#flipBtn').hidden = !(v === 'front' || v === 'back');
  if (instant) { camera.position.copy(toPos); controls.target.copy(cfg.target); controls.update(); return; }
  const p0 = camera.position.clone(), t0v = controls.target.clone();
  controls.enabled = false;
  await tween(700, (k) => { camera.position.lerpVectors(p0, toPos, k); controls.target.lerpVectors(t0v, cfg.target, k); });
  controls.enabled = true; positionFloatingTool();
}
function resize() {
  const r = stage.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false); renderer.domElement.style.width = r.width + 'px'; renderer.domElement.style.height = r.height + 'px';
  camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
}
new ResizeObserver(() => { resize(); }).observe(stage);

// ───────── Flip del reloj ─────────
let flipped = false;
async function flip(toBack) {
  if (toBack === flipped) { await setView(toBack ? 'back' : 'front'); return; }
  const r0 = W.root.rotation.z, r1 = toBack ? Math.PI : 0, y0 = W.root.position.y, y1 = toBack ? WATCH_Y_BACK : WATCH_Y_FRONT;
  flipped = toBack;
  const cam = setView(toBack ? 'back' : 'front');
  await tween(900, (k) => { W.root.rotation.z = r0 + (r1 - r0) * k; W.root.position.y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 22; });
  await cam;
}

// ───────── Piezas: quitar / soporte / inspección / reensamblar ─────────
let traySlot = 0;
function traySpot() { const i = traySlot++; return new THREE.Vector3(36 + (i % 4) * 15, 0.6, 30 + Math.floor(i / 4) * 15); }
function record(id, obj) { removed.push({ id, obj, parent: obj.parent, pos: obj.position.clone(), quat: obj.quaternion.clone() }); removedSet.add(id); }
async function moveWorld(obj, toPos, toQuat, dur = 900, opts = {}) {
  scene.attach(obj);
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), lift = opts.lift ?? 18, spin = opts.spin || 0;
  await tween(dur, (k) => {
    obj.position.lerpVectors(p0, toPos, k); obj.position.y += Math.sin(k * Math.PI) * lift;
    obj.quaternion.slerpQuaternions(q0, toQuat, k);
    if (spin) obj.rotateY(spin * Math.sin(k * Math.PI) * 0.05);
  });
}
async function removePart(id, opts = {}) {
  const obj = W.parts[id]; if (!obj) return;
  record(id, obj);
  if (opts.unscrew) { // gira a la izquierda (desenroscar) antes de levantar
    const r0 = obj.rotation.y; await tween(500, (k) => { obj.rotation.y = r0 + k * 1.6; obj.position.y += 0.01; });
  }
  const q = new THREE.Quaternion();
  if (id === 'caseback') q.setFromEuler(new THREE.Euler(Math.PI, 0, 0)); // mostrar cara interior/exterior plana
  await moveWorld(obj, traySpot(), q, 850);
  addTrayChip(PARTS[id]?.name || id);
}
async function toHolder() {
  const obj = W.parts.movement; record('movement', obj);
  W.parts.spacer.visible = true;
  await moveWorld(obj, HOLDER_POS.clone().add(new THREE.Vector3(0, 8.2, 0)), new THREE.Quaternion(), 1200, { lift: 30 });
  addTrayChip('Caja (aparte)');
}
async function toInspect(id) {
  const obj = W.parts[id]; record(id, obj);
  await moveWorld(obj, INSPECT_POS.clone(), new THREE.Quaternion(), 1000, { lift: 20 });
  addTrayChip(PARTS[id]?.name || id);
}
async function reassemble() {
  busy = true;
  const steps = removed.slice().reverse();
  W.spring.rotation.y = 0; W.spring.position.x = 0;
  for (const r of steps) {
    say(`🔧 Montando: <b>${PARTS[r.id]?.name || r.id}</b>`);
    r.parent.attach(r.obj);
    const p0 = r.obj.position.clone(), q0 = r.obj.quaternion.clone();
    await tween(r.id === 'movement' ? 900 : 520, (k) => { r.obj.position.lerpVectors(p0, r.pos, k); r.obj.position.y += Math.sin(k * Math.PI) * 6; r.obj.quaternion.slerpQuaternions(q0, r.quat, k); });
    if (r.id === 'movement') await setView('back');
  }
  removed.length = 0; removedSet.clear(); $('#tray').innerHTML = ''; traySlot = 0;
  amp = 286; running = true;
  await flip(false);
  busy = false;
}

// ───────── Herramientas: UI + modelo flotante ─────────
const toolsEl = $('#tools');
TOOLS.forEach(t => {
  const b = document.createElement('button'); b.className = 'tool'; b.dataset.tool = t.id;
  b.innerHTML = `<img class="stamp" src="" alt=""><svg viewBox="0 0 32 32">${ICONS[t.id] || ''}</svg><span>${t.short || t.name}</span>`;
  b.onclick = () => { if (!started || busy) return; sel = sel === t.id ? null : t.id; renderTools(); showFloatingTool(); if (sel) say(`<b>${t.name}:</b> ${t.desc}<br><span class="small">Ahora toca la pieza donde la quieres usar.</span>`); };
  toolsEl.appendChild(b);
});
function renderTools() { document.querySelectorAll('.tool').forEach(b => { b.classList.toggle('sel', b.dataset.tool === sel); b.classList.remove('hint'); }); }
function showFloatingTool() {
  toolGroup.clear(); floatingTool = null;
  if (!sel || !T.models[sel]) return;
  floatingTool = T.models[sel]; toolGroup.add(floatingTool); positionFloatingTool();
}
function positionFloatingTool() {
  if (!floatingTool) return;
  const cfg = VIEWS[view === 'back' ? 'back' : view](); const s = cfg.size / 60;
  floatingTool.scale.setScalar(s);
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  floatingTool.position.copy(controls.target).add(right.multiplyScalar(cfg.size * 0.36)).add(new THREE.Vector3(0, cfg.size * 0.25, -cfg.size * 0.1));
  floatingTool.userData.base = floatingTool.position.clone();
}
async function applyToolAnim(partId) {
  if (!floatingTool) return;
  const obj = W.parts[partId] || (partId === 'watch' ? W.root : null); if (!obj) return;
  const target = new THREE.Vector3(); obj.getWorldPosition(target); target.y += VIEWS[view === 'back' ? 'back' : view]().size * 0.08;
  const p0 = floatingTool.position.clone(); const ft = floatingTool;
  await tween(320, (k) => ft.position.lerpVectors(p0, target, k));
  await tween(320, (k) => ft.position.lerpVectors(target, p0, k));
}

// ───────── Mensajes / puntuación ─────────
function say(html, kind) { const m = $('#msg'); m.innerHTML = html; m.className = kind || ''; }
function penalize(n) { score = Math.max(0, score - n); $('#score').textContent = '⭐ ' + score; }
function bad(html) { errors++; penalize(5); say('❌ ' + html, 'bad'); stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
function addTrayChip(t) { const s = document.createElement('span'); s.textContent = t.replace(/^el |^la /, ''); $('#tray').prepend(s); }
const step = () => CASE.steps[cur];
function updateBar() {
  const s = step();
  $('#steptxt').textContent = s ? `Paso ${cur + 1}/${CASE.steps.length}: ${s.title}` : '¡Trabajo terminado!';
  $('#phase').textContent = s ? s.phase : '';
  $('#progress i').style.width = (cur / CASE.steps.length * 100) + '%';
  const btn = $('#actionBtn');
  btn.hidden = !(s && s.button); if (s && s.button) btn.textContent = s.button === true ? 'Reensamblar' : s.button;
}

// ───────── Lógica de toque ─────────
function handleTap(chain) {
  if (!started || busy || !CASE) return;
  const s = step(); if (!s) return;
  const part = s.target && chain.includes(s.target) ? s.target : chain[0];
  if (!sel) { say(`Primero elige una <b>herramienta</b> abajo. Tocaste ${PARTS[part]?.name || part}.`); return; }
  if (sel === 'demag' && ['watch', 'movement', 'balance'].includes(part)) {
    demagUsed = true; say('🧲 Desmagnetizado por precaución. El timegrapher no cambia: <b>no era magnetismo</b> (el magnetismo normalmente hace que se <b>adelante</b>).'); return;
  }
  if (sel === 'handLevers') { bad('No hace falta quitar agujas ni esfera: desarma <b>solo lo necesario</b>.'); return; }
  if (sel === 'blower') { say('💨 Soplaste el polvo. Limpio, pero no resuelve la falla.'); return; }
  if (sel === 'compass' && part !== 'watch') { /* sigue lógica normal */ }
  if (part === s.target) { if (sel === s.tool) complete(); else bad(s.wrong); return; }
  if (removedSet.has(part)) { say(`${cap(PARTS[part]?.name || part)} ya está fuera. Sigue con: <b>${s.title}</b>.`); return; }
  const idx = STEP_OF[part];
  if (idx !== undefined && done.has(CASE.steps[idx].id) && idx < cur) { say(`Ya terminaste con ${PARTS[part]?.name}. Sigue con: <b>${s.title}</b>.`); return; }
  if (idx !== undefined && idx > cur) {
    const cov = PARTS[part]?.coveredBy;
    if (cov && !removedSet.has(cov) && STEP_OF[cov] !== undefined) bad(`Orden incorrecto: ${PARTS[part].name} está tapado por ${PARTS[cov].name}.`);
    else bad(`Orden incorrecto: todavía no. Antes debes: <b>${s.title}</b>.`);
    return;
  }
  if (s.view !== view && s.view === 'back' && view === 'front') { say('Voltea el reloj (↻) para trabajar en el fondo.'); return; }
  bad(`Ahí no. Paso actual: <b>${s.title}</b>.`);
}
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

async function complete() {
  const s = step(); busy = true; done.add(s.id);
  const usedTool = sel;
  if (s.target) await applyToolAnim(s.target);
  sel = null; renderTools(); showFloatingTool();
  cur++; updateBar();
  for (const a of (s.done || [])) await runAction(a, s, usedTool);
  busy = false;
}
async function runAction(a) {
  if (a.msg) say(a.msg, 'good');
  if (a.flip) await flip(a.flip === 'back');
  if (a.view) await setView(a.view);
  if (a.remove) for (const id of a.remove) await removePart(id, a);
  if (a.toHolder) await toHolder();
  if (a.toInspect) await toInspect(a.toInspect);
  if (a.letdown) running = false;
  if (a.reveal) { W.dirt.material.color.set(0x2a1c08); flashLabel('⚠ Aceite seco y oscurecido en el rubí'); }
  if (a.openSpring) { await tween(500, (k) => { W.spring.rotation.y = -0.9 * k; W.spring.position.x = -0.5 * k; }); }
  if (a.clean) { await tween(500, (k) => { W.dirt.scale.setScalar(1 - k * 0.99); }); W.dirt.visible = false; flashLabel('Rubí limpio'); }
  if (a.oil) { W.oil.visible = true; W.oil.scale.setScalar(0.01); await tween(500, (k) => W.oil.scale.setScalar(Math.max(0.01, k))); flashLabel('✓ Gota de 9010 centrada'); }
  if (a.tg) await showTG(a.tg);
  if (a.finish) finish();
}
function flashLabel(t) { const l = $('#label3d'); l.textContent = t; l.hidden = false; clearTimeout(l._t); l._t = setTimeout(() => (l.hidden = true), 3500); }

$('#actionBtn').onclick = async () => {
  const s = step(); if (!s || !s.button || busy) return;
  $('#actionBtn').hidden = true; done.add(s.id); cur++; updateBar();
  if (s.id === 'reassemble') { say('🔧 Reensamblando en <b>orden inverso</b>…'); await reassemble(); say('Listo. Ahora la <b>prueba final</b> con el timegrapher.', 'good'); }
  else { busy = true; for (const a of (s.done || [])) await runAction(a, s); busy = false; }
};
$('#flipBtn').onclick = () => { if (!busy && (view === 'front' || view === 'back')) { busy = true; flip(!flipped).then(() => busy = false); } };

// ───────── Timegrapher ─────────
async function showTG(v) {
  const prev = view;
  T.tgScreen.boot();
  await setView('tg');
  $('#tgVals').innerHTML = `<div class="${v.amp < 250 ? 'warn' : ''}">Marcha<b>${v.rate > 0 ? '+' : ''}${v.rate}</b>s/día</div><div class="${v.amp < 250 ? 'warn' : ''}">Amplitud<b>${v.amp}°</b></div><div>Error<b>${v.be.toFixed(1)}</b>ms</div><div>Levée<b>50°</b>4 Hz</div>`;
  $('#tgNote').innerHTML = v.note || '';
  $('#tgTitle').textContent = 'LA FURY TG-1 · arrancando…';
  $('#tgPanel').hidden = false; $('#tgClose').disabled = true;
  await sleep(1100);
  T.tgScreen.trace(v); $('#tgTitle').textContent = 'Timegrapher LA FURY TG-1';
  $('#tgClose').disabled = false;
  await new Promise(res => { $('#tgClose').onclick = () => { $('#tgPanel').hidden = true; res(); }; });
  await setView(prev === 'tg' ? 'front' : prev);
}

// ───────── Pista ─────────
$('#hintBtn').onclick = () => {
  if (!started || busy) return; const s = step(); if (!s) return;
  hints++; penalize(2);
  if (s.button) { say(`💡 Pulsa el botón <b>${s.button === true ? 'Reensamblar' : s.button}</b>.`); return; }
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('hint', b.dataset.tool === s.tool));
  highlightPart(s.target);
  say(`💡 Usa <b>${TOOLS.find(t => t.id === s.tool).name}</b> sobre <b>${PARTS[s.target]?.name}</b>.`);
};
function highlightPart(id) {
  const obj = W.parts[id]; if (!obj || id === 'movement') return;
  const mats = []; obj.traverse(o => { if (o.isMesh && !o.userData.isHit && o.material && o.material.emissive) { const m = o.material.clone(); o.material = m; mats.push(m); } });
  tween(1600, (k, raw) => { const v = Math.abs(Math.sin(raw * Math.PI * 4)) * 0.6; mats.forEach(m => m.emissive.setRGB(v, v * 0.8, v * 0.3)); }, () => mats.forEach(m => m.emissive.setRGB(0, 0, 0)));
}

// ───────── Raycast (toque) ─────────
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (d > 10 || dt > 600) return;
  const chain = pickChain(e.clientX, e.clientY); if (chain.length) handleTap(chain);
});
function pickChain(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(scene.children.filter(o => o !== toolGroup), true);
  for (const h of hits) {
    const chain = []; let n = h.object; while (n) { if (n.userData.partId) chain.push(n.userData.partId); n = n.parent; }
    if (chain.length) return chain;
    if (!h.object.userData.isHit) return [];
  }
  return [];
}

// ───────── Fin ─────────
function finish() {
  const e = Math.floor((Date.now() - t0) / 1000);
  const stars = score >= 90 ? '⭐⭐⭐' : score >= 70 ? '⭐⭐' : '⭐';
  $('#endCard').innerHTML = `<h2>¡${CASE.id === 'atrasa' ? 'Reloj reparado' : 'Práctica completada'}! ${stars}</h2>
  <p>Puntos: <b>${score}</b> · Errores: <b>${errors}</b> · Pistas: <b>${hints}</b> · Tiempo: <b>${Math.floor(e / 60)}:${String(e % 60).padStart(2, '0')}</b>${demagUsed ? ' · Desmagnetizaste por precaución 👍' : ''}</p>
  <p><b>Lo que aprendiste:</b></p><ul>${CASE.lessons.map(l => `<li>${l}</li>`).join('')}</ul>
  <p class="small">Nota del maestro: ${CASE.note}</p>
  <div class="shop"><img src="${images.logo.src}" alt="LA FURY"><div><b class="gold">Tienda LA FURY Tools &amp; Jewelry</b><br><span class="small">Cobraste el trabajo. Próximamente: herramientas premium LA FURY y la línea de joyería (anillos, cadenas, engaste).</span></div></div>
  <div class="row"><button class="btn ghost" onclick="location.reload()">Menú</button><button class="btn" id="againBtn">Jugar otra vez</button></div>`;
  $('#endOverlay').hidden = false;
  $('#againBtn').onclick = () => location.reload();
}

// ───────── Inicio ─────────
function buildIntro() {
  $('#introLogo').src = images.logo.src; $('#headLogo').src = images.badge.src; $('#toolheadLogo').src = images.logo.src;
  document.querySelectorAll('.tool .stamp').forEach(i => i.src = images.badge.src);
  const list = $('#caseList'); list.innerHTML = '';
  CASES.forEach(c => {
    const b = document.createElement('button'); b.className = 'casecard'; b.dataset.case = c.id;
    b.innerHTML = `<b>${c.title}</b><span>${c.subtitle}</span><div class="ticket">CLIENTE: ${c.ticket.cliente}<br>RELOJ: ${c.ticket.reloj}<br>CALIBRE: ${c.ticket.calibre}<br>QUEJA: <b>${c.ticket.queja}</b></div>`;
    b.onclick = () => startCase(c.id); list.appendChild(b);
  });
}
function startCase(id) {
  CASE = CASES.find(c => c.id === id); cur = 0; done.clear();
  STEP_OF = {}; CASE.steps.forEach((s, i) => { if (s.target && !(s.target in STEP_OF) && s.target !== 'watch') STEP_OF[s.target] = i; });
  amp = CASE.start.amp; running = CASE.start.running;
  $('#intro').hidden = true; started = true; t0 = Date.now();
  updateBar(); say(CASE.intro);
}

async function init() {
  images = await loadAllImages();
  M = makeMaterials(images);
  // banco + alfombrilla con marca LA FURY
  const bench = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 }));
  bench.rotation.x = -Math.PI / 2; bench.position.y = -0.2; bench.receiveShadow = true; scene.add(bench);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(220, 170), new THREE.MeshStandardMaterial({ map: matTexture(images.logo), roughness: 0.95 }));
  mat.rotation.x = -Math.PI / 2; mat.position.set(-6, 0, 6); mat.receiveShadow = true; scene.add(mat);
  W = buildWatch(M); W.root.position.y = WATCH_Y_FRONT; scene.add(W.root);
  T = makeTools(M, images);
  T.tg.position.copy(TG_POS); T.tg.rotation.y = -0.75; scene.add(T.tg);
  T.holder.position.copy(HOLDER_POS); scene.add(T.holder);
  const insp = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0x0d1a14, roughness: 0.9 })); insp.position.copy(INSPECT_POS).add(new THREE.Vector3(0, -0.3, 0)); insp.receiveShadow = true; scene.add(insp);
  buildIntro(); resize(); await setView('front', true);
  $('#loading').hidden = true;
  requestAnimationFrame(loop);
}

// ───────── Bucle ─────────
const clock = new THREE.Clock();
function loop(now) {
  runTweens(now);
  const t = clock.getElapsedTime();
  // agujas en hora real; segundero en 8 pasos/seg (28.800 A/h)
  const d = new Date(); const sec = d.getSeconds() + Math.floor(d.getMilliseconds() / 125) / 8, mn = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + mn / 60;
  if (running) { W.hands.s.rotation.y = -sec / 60 * Math.PI * 2; W.hands.m.rotation.y = -mn / 60 * Math.PI * 2; W.hands.h.rotation.y = -hr / 12 * Math.PI * 2; }
  // volante: 4 Hz con la amplitud real del caso (188° → 286°)
  W.balanceWheel.rotation.y = running ? THREE.MathUtils.degToRad(amp) * Math.sin(t * Math.PI * 2 * 4) : W.balanceWheel.rotation.y * 0.9;
  if (running) { W.parts.escapeWheel.rotation.y = -Math.floor(t * 8) * (Math.PI * 2 / 20) / 2; W.parts.secondWheel.rotation.y = -sec / 60 * Math.PI * 2; }
  if (floatingTool && floatingTool.userData.base && !tweens.length) { floatingTool.rotation.y = t * 0.6; floatingTool.position.y = floatingTool.userData.base.y + Math.sin(t * 2) * 0.4; }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// API de pruebas (Playwright)
window.__game = {
  get step() { return cur; }, get current() { const s = CASE && CASE.steps[cur]; return s ? { id: s.id, tool: s.tool, target: s.target, button: !!s.button } : null; }, get steps() { return CASE ? CASE.steps.length : 0; }, get view() { return view; }, get score() { return score; }, get busy() { return busy; }, get started() { return started; },
  startCase, selectTool: (id) => { sel = id; renderTools(); showFloatingTool(); },
  tap: (id) => handleTap([id]),
  screenOf: (id) => {
    let o = id === 'watch' ? W.root : W.parts[id]; if (!o) return null;
    if (id !== 'watch' && id !== 'movement') { let hp = null; o.traverse(c => { if (!hp && c.userData.isHit) hp = c; }); if (hp) o = hp; }
    const p = new THREE.Vector3(); o.getWorldPosition(p);
    if (id === 'jewel') p.y += 0.1;
    p.project(camera); const r = renderer.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  },
  pick: (x, y) => pickChain(x, y),
  get glOK() { return !!renderer.getContext(); }
};
init().catch(err => { console.error(err); $('#loading').textContent = 'Error al cargar: ' + err.message; });
