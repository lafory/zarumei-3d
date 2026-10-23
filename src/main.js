// ZARUMEI · Taller de Relojería 3D — LA FORY Tools & Jewelry
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TOOLS, SCREWDRIVER_SIZES } from './data/tools.js';
import { WATCHES } from './data/watches.js';
import { CALIBERS } from './data/calibers.js';
import { FAULTS } from './data/faults.js';
import { STORY } from './data/story.js';
import { SPARES, SPARE_ORDER } from './data/spares.js';
import { createEngine } from './engine.js';
import { loadAllImages, leatherTexture, velvetTexture, onyxTexture, clothTexture, contactShadowTexture } from './textures.js';
import { openBoutique, initBoutique, wallet, queuePortraits } from './boutique.js';
import { fmtPrice } from './data/boutique.js';
import { makeMaterials } from './materials.js';
import { buildZR28, buildZQ11 } from './movement.js';
import { buildZT18 } from './tourbillon.js';
import { buildGrand } from './grand.js';
import { buildZX60 } from './habana.js';
import { buildCase } from './case3d.js';
import { buildDial, buildHands } from './dialside.js';
import { makeTools } from './tools3d.js';
import { ICONS } from './icons.js';
import { unlock as unlockAudio, play as playSfx, pulse as pulseSfx, setMuted, isMuted } from './audio.js';
import * as book from './accounts.js';
import { BUILD_OPTS, DRAFT_ID, watchFromSpec, loadBuilds, rememberBuild, markBuildReady, isBuildReady, forgetBuild, cleanName, suggestedName, dialFits } from './build.js';

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
let hq = false;
try { hq = localStorage.getItem('zarumei.hq') === '1'; } catch (e) { /* privado */ }
// DPR: el modo normal cabe en ~2,6 MP. Vista 8K usa hasta 3× la pantalla (no un framebuffer de 7680²: eso tumba el teléfono).
function applyDPR(w, h) {
  const dpr = window.devicePixelRatio || 1;
  if (hq) { renderer.setPixelRatio(Math.min(3, Math.max(1, dpr))); return; }
  const budget = 2.6e6;
  const cap = Math.min(2, Math.max(1, Math.sqrt(budget / Math.max(1, w * h))));
  renderer.setPixelRatio(Math.min(dpr, cap));
}
applyDPR(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0908);
const baseFog = new THREE.Fog(0x0a0908, 640, 1400);
scene.fog = baseFog;
scene.environment = studioEnvMap();
scene.environmentIntensity = 1.05;
const camera = new THREE.PerspectiveCamera(23, 1, 1, 1500);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = true; controls.screenSpacePanning = true; controls.panSpeed = 0.55;
controls.maxPolarAngle = 1.25; controls.minPolarAngle = 0.08; controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.65;
scene.add(new THREE.HemisphereLight(0xf4efe6, 0x16120e, 0.08));
// La forma del metal la da el entorno. Estas luces solo modelan y proyectan la sombra de contacto.
const spot = new THREE.SpotLight(0xfff4e6, 4200, 520, 0.62, 1, 2); spot.position.set(28, 160, 54); spot.target.position.set(0, 4, 4); scene.add(spot, spot.target);
const sun = new THREE.DirectionalLight(0xfff6ee, 0.46); sun.position.set(48, 140, 36); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 3.2;
Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 20, far: 420 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun);
const lamp = new THREE.PointLight(0xffe6c8, 180, 220, 2); lamp.position.set(-28, 48, 30); scene.add(lamp);
const rim = new THREE.DirectionalLight(0xc5d2e4, 0.38); rim.position.set(-90, 28, -80); scene.add(rim);

function studioEnvMap() {
  const env = new THREE.Scene();
  const geo = new THREE.BoxGeometry(); geo.deleteAttribute('uv');
  const room = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x161310, side: THREE.BackSide }));
  room.scale.set(48, 26, 48); room.position.y = 1; env.add(room);
  const floor = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x090807 }));
  floor.position.set(0, -8, 0); floor.scale.set(40, 0.4, 40); env.add(floor);
  const panel = (hex, gain, x, y, z, sx, sy, sz) => {
    const m = new THREE.MeshBasicMaterial();
    m.color.setHex(hex).multiplyScalar(gain);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); env.add(mesh);
  };
  panel(0xfff6ec, 1.0, 0, 13, 2, 26, 0.28, 18);
  panel(0xfffaf4, 2.4, 1.2, 9.2, 4.2, 8, 0.1, 2.2);
  panel(0xfff1df, 2.5, 10, 6.5, 8, 0.16, 9, 5.5);
  panel(0xd5e2f2, 1.25, -12, 5, 2, 0.16, 6, 4);
  panel(0xe7eef8, 1.5, 0, 5.2, -14, 9, 2.4, 0.12);
  const prev = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(env, 0.012).texture;
  pmrem.dispose();
  renderer.toneMapping = prev;
  return map;
}

let composer = null, bokehPass = null;
function ensureDof() {
  if (composer) return;
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bokehPass = new BokehPass(scene, camera, { focus: 50, aperture: 0.00012, maxblur: 0.004 });
  composer.addPass(bokehPass);
  const r = stage.getBoundingClientRect();
  composer.setSize(r.width, r.height);
}

const HOLDER_POS = new THREE.Vector3(-64, 0, 14), INSPECT_POS = new THREE.Vector3(-36, 0.6, 60), TG_POS = new THREE.Vector3(100, 0, -72), TRAY_POS = new THREE.Vector3(34, 0, -12);
let images, M, T, G = null; // G = partida actual
const toolGroup = new THREE.Group(); scene.add(toolGroup);
let floatingTool = null, sel = null, size = 1.0, view = 'front', busy = false, started = false, t0 = 0, mode = 'story', storyCase = null, sessionLive = false;
let seatMode = true, heldId = null, seatRing = null;
try { if (localStorage.getItem('zarumei.seat') === '0') seatMode = false; } catch (e) { /* privado */ }

// ───────── cámara ─────────
function partWorldCenter(obj) { const b = new THREE.Box3().setFromObject(obj); return { c: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).length() / 2 }; }
let loupeTarget = null;
const VIEWS = {
  front: () => ({ target: new THREE.Vector3(0, 4, 4), size: G && G.W.case.style === 'slim' ? 46 : G && G.W.case.style === 'astral' ? 50 : 52, dir: new THREE.Vector3(0, 1, 0.5) }),
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
  document.querySelectorAll('.vbtn[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v || (b.dataset.view === 'watch' && (v === 'front' || v === 'back'))));
  updateFlipBtn();
  controls._sphericalDelta.set(0, 0, 0); controls._panOffset.set(0, 0, 0); controls._scale = 1;
  if (instant || SPEED < 0.2) { camera.position.copy(toPos); controls.target.copy(cfg.target); controls.update(); positionFloatingTool(); return; }
  const p0 = camera.position.clone(), t0v = controls.target.clone(); controls.enabled = false;
  await tween(D(650), (k) => { camera.position.lerpVectors(p0, toPos, k); controls.target.lerpVectors(t0v, cfg.target, k); });
  controls.enabled = true; positionFloatingTool();
}
function workView() { if (!G) return 'front'; return G.E.flags.mvLoc === 'holder' ? 'holder' : (G.E.flags.flipped ? 'back' : 'front'); }

let landingOn = false, landK = 0, landKs = 0, landBeat = -1, spinHome = null;
const landTilt = { x: 0, y: 0 };
const GALLERY_SPEC = [
  { id: 'miami', face: 'bridges', name: 'ZR-28' },
  { id: 'astralMiami', face: 'dial', name: 'ZT-18' },
  { id: 'diablo', face: 'bridges', name: 'ZC-40' },
  { id: 'orbital', face: 'dial', name: 'ZC-43' }
];
const GALLERY_GAP = 130;
const LAND_CAM = (() => {
  const keys = [];
  GALLERY_SPEC.forEach((_, i) => {
    const x = i * GALLERY_GAP, t = i * 0.22;
    keys.push(
      { t: t + 0.000, cam: [x + 8, 6, 108], look: [x, 0, 0] },
      { t: t + 0.07, cam: [x - 18, 2, 102], look: [x, 0, 0] },
      { t: t + 0.14, cam: [x + 6, 10, 112], look: [x, 2, 0] }
    );
  });
  const end = (GALLERY_SPEC.length - 1) * GALLERY_GAP;
  keys.push({ t: 0.9, cam: [end + 4, 6, 108], look: [end, 0, 0] });
  keys.push({ t: 1, cam: [end + 4, 6, 108], look: [end, 0, 0] });
  return keys.map(p => ({ t: p.t, cam: new THREE.Vector3(...p.cam), look: new THREE.Vector3(...p.look) }));
})();
const LAND_BEATS = [
  { k: 0, kicker: 'ZARUMEI 3D', title: 'La bóveda', text: 'Desliza. La cámara entra en el reloj.' },
  { k: 0.10, kicker: 'El fondo', title: 'Se abre', text: 'El fondo sale. Detrás está la máquina.' },
  { k: 0.24, kicker: 'Calibre ZR-28', title: 'Dentro', text: 'Ruedas, rubíes y el volante, en marcha.' },
  { k: 0.30, kicker: 'La bóveda', title: 'Flota', text: 'Sin caja y sin peana. El reloj queda en el aire.' },
  { k: 0.46, kicker: 'Miami', title: 'Oro', text: 'La esfera entra sola. El brazalete cuelga.' },
  { k: 0.58, kicker: 'Astral', title: 'Turbillón', text: 'Gira entero, como recortado del fondo.' },
  { k: 0.70, kicker: 'Diablo', title: 'Rojo', text: 'Laca, máscara y cronógrafo. Nada lo sostiene.' },
  { k: 0.84, kicker: 'El libro', title: 'Entra', text: 'Tu nombre guarda el tiempo y el reloj a medias.' }
];
const INSIDE_END = 0.30, VAULT_AT = 0.36;
const INSIDE_CAM = [
  { t: 0.00, cam: [0, 74, 52], look: [0, 6, 2] },
  { t: 0.18, cam: [32, 46, 30], look: [0, 5, 0] },
  { t: 0.36, cam: [22, 34, 20], look: [0, 6, 0] },
  { t: 0.55, cam: [32, 20, 26], look: [0, 3, 0] },
  { t: 0.78, cam: [24, 14, 18], look: [0, 2, 0] },
  { t: 1.00, cam: [18, 32, 36], look: [0, 6, 0] }
].map(p => ({ t: p.t, cam: new THREE.Vector3(...p.cam), look: new THREE.Vector3(...p.look) }));
const SPIN_IDS = ['rotor', 'escapeWheel', 'secondWheel', 'thirdWheel', 'fourthWheel', 'interWheel', 'centerWheel', 'fifthWheel', 'ratchet', 'dateDisc', 'dayDisc', 'monthDisc', 'moonDisc', 'hourWheel', 'minuteWheel', 'dateDriver', 'stepRotor'];
function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function ramp(a, b, k) { const t = clamp01((k - a) / Math.max(0.0001, b - a)); return t * t * (3 - 2 * t); }
function frameLanding(cam, look, lift = true) {
  const aspect = camera.aspect || 1;
  const ref = 0.72;
  if (aspect >= ref) return { cam, look };
  const pull = Math.min(lift ? 1.12 : 1.55, ref / aspect);
  const aimed = look.clone();
  if (lift) aimed.y += 11 * (pull - 1);
  const out = aimed.clone().add(cam.clone().sub(look).multiplyScalar(pull));
  return { cam: out, look: aimed };
}
function samplePath(keys, k, key) {
  let i = 0;
  while (i < keys.length - 2 && k > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = a.t === b.t ? 1 : clamp01((k - a.t) / (b.t - a.t));
  const s = u * u * (3 - 2 * u);
  return a[key].clone().lerp(b[key], s);
}
function along(k, key) { return samplePath(LAND_CAM, k, key); }
function captureSpin() {
  if (!G || spinHome) return;
  spinHome = {};
  for (const id of SPIN_IDS) if (G.parts[id]) spinHome[id] = G.parts[id].rotation.y;
  if (G.MV.wheel) spinHome.wheel = G.MV.wheel.rotation.y;
}
function restoreLandingPose() {
  if (!G) return;
  const cb = G.parts.caseback, h = G.home.caseback;
  if (cb && h) { cb.position.copy(h.pos); cb.quaternion.copy(h.quat); cb.scale.copy(h.scale); }
  G.root.rotation.set(0, 0, 0);
  G.root.position.y = G.CS.dims.yFront;
  if (spinHome) {
    for (const id of SPIN_IDS) if (G.parts[id] && id in spinHome) G.parts[id].rotation.y = spinHome[id];
    if (G.MV.wheel && 'wheel' in spinHome) G.MV.wheel.rotation.y = spinHome.wheel;
  }
  spinHome = null;
  if (T) { T.tg.visible = T.holder.visible = T.tray.visible = true; }
  G.root.visible = true;
  if (gallery) gallery.visible = false;
  if (benchDress) benchDress.visible = true;
  if (benchPlane) benchPlane.visible = true;
  camera.near = 1; camera.fov = 23; camera.updateProjectionMatrix();
  renderer.toneMappingExposure = 1.02;
  scene.environmentIntensity = 1.05;
  scene.fog = baseFog;
}
function paintBeat(k) {
  let i = 0;
  for (let n = 0; n < LAND_BEATS.length; n++) if (k >= LAND_BEATS[n].k) i = n;
  if (i !== landBeat) {
    landBeat = i;
    const b = LAND_BEATS[i];
    $('#landKicker').textContent = b.kicker;
    $('#landTitle').textContent = b.title;
    $('#landText').textContent = b.text;
  }
  $('#landCopy').classList.toggle('off', k > 0.9);
  $('#landChevron').style.display = k > 0.04 ? 'none' : '';
  const bar = $('#landBar'); if (bar) bar.style.height = (k * 100).toFixed(1) + '%';
}
function paintLandingAuth() {
  const u = book.current();
  const hello = $('#landHello'), form = $('#landForm');
  if (!hello || !form) return;
  hello.hidden = !u; form.hidden = !!u;
  if (u) $('#landWho').textContent = u.name;
  const err = $('#gateErr'); if (err) err.textContent = '';
}
function openLanding() {
  if (!G) return;
  captureSpin();
  landingOn = true; landBeat = -1;
  document.documentElement.classList.add('land');
  document.body.classList.add('land');
  $('#landScroll').hidden = false;
  $('#landing').hidden = false;
  $('#intro').hidden = true;
  $('#profile').hidden = true;
  if (T) { T.tg.visible = T.holder.visible = T.tray.visible = false; }
  if (G) G.root.visible = true;
  if (gallery) gallery.visible = false;
  if (benchDress) benchDress.visible = false;
  if (benchPlane) benchPlane.visible = false;
  controls.enabled = false;
  camera.near = 0.4; camera.fov = 36; camera.updateProjectionMatrix();
  renderer.toneMappingExposure = 1.22;
  scene.environmentIntensity = 1.2;
  scene.fog = new THREE.Fog(0x07060a, 1400, 2400);
  paintLandingAuth();
  resize();
}
function closeLanding() {
  landingOn = false; landK = landKs = 0;
  document.documentElement.classList.remove('land');
  document.body.classList.remove('land');
  $('#landing').hidden = true;
  $('#landScroll').hidden = true;
  window.scrollTo(0, 0);
  try { restoreLandingPose(); } catch (err) { console.warn(err); }
  controls.enabled = true;
  renderer.toneMappingExposure = hq ? 1.08 : 1.02;
  scene.environmentIntensity = hq ? 1.15 : 1.05;
  scene.fog = baseFog;
  resize();
  try { setView('front', true); } catch (err) { console.warn(err); }
  enterApp();
}
function spinParts(parts, wheel, t) {
  if (!parts) return;
  const turn = (id, spd, phase = 0) => { if (parts[id]) parts[id].rotation.y = t * spd + phase; };
  turn('rotor', 0.55, 0.4);
  turn('centerWheel', 0.22);
  turn('thirdWheel', 0.7);
  turn('fourthWheel', -0.5);
  turn('secondWheel', -1.15);
  turn('interWheel', 0.42);
  turn('fifthWheel', 0.9);
  turn('escapeWheel', 2.6);
  turn('ratchet', 0.18);
  turn('dateDisc', 0.12);
  turn('dayDisc', 0.2);
  turn('monthDisc', -0.08);
  turn('moonDisc', 0.15);
  turn('hourWheel', 0.16);
  turn('minuteWheel', -0.28);
  turn('dateDriver', 0.33);
  turn('stepRotor', 1.4);
  if (wheel) wheel.rotation.y = Math.sin(t * Math.PI * 7) * 1.05;
}
function poseInside(u, t) {
  const flip = ramp(0.10, 0.34, u);
  G.root.rotation.z = flip * Math.PI;
  G.root.position.y = THREE.MathUtils.lerp(G.CS.dims.yFront, G.CS.dims.yBack, flip);
  const open = ramp(0.36, 0.62, u);
  const cb = G.parts.caseback, h = G.home.caseback;
  if (cb && h) { cb.position.copy(h.pos); cb.position.y = h.pos.y - open * 16; }
  if (u > 0.4) spinParts(G.parts, G.MV.wheel, t);
  G.root.traverse(o => { if (o.name === 'cageSpin') o.rotation.y = t * 0.7; });
}
function poseFloat(t) {
  const cb = G.parts.caseback, h = G.home.caseback;
  if (cb && h) { cb.position.copy(h.pos); cb.quaternion.copy(h.quat); cb.scale.copy(h.scale); }
  G.root.rotation.set(Math.PI / 2, Math.sin(t * 0.55) * 0.38, 0);
  G.root.position.set(0, Math.sin(t * 0.8) * 1.4, 0);
  const sec = G.parts.secHand && G.parts.secHand.getObjectByName('rot');
  if (sec) sec.rotation.y = -((t * 0.12) % 1) * Math.PI * 2;
}
function driveLanding(t) {
  if (!G) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max > 0) landK = window.scrollY / max;
  landKs += (landK - landKs) * 0.18;
  const k = landKs;
  const insideU = clamp01(k / INSIDE_END);
  const vaultU = clamp01((k - VAULT_AT) / (0.9 - VAULT_AT));
  const showVault = k >= VAULT_AT;
  if (G.root) G.root.visible = true;
  if (gallery) gallery.visible = false;
  if (!showVault) poseInside(insideU, t);
  else poseFloat(t);
  let cam, look;
  if (!showVault) {
    cam = samplePath(INSIDE_CAM, insideU, 'cam');
    look = samplePath(INSIDE_CAM, insideU, 'look');
  } else {
    cam = new THREE.Vector3(Math.sin(vaultU * Math.PI) * 16, 4, 116);
    look = new THREE.Vector3(0, 0, 0);
  }
  const framed = showVault ? { cam, look } : frameLanding(cam, look, false);
  framed.cam.x += landTilt.x * 10;
  framed.cam.y += landTilt.y * 6;
  camera.position.copy(framed.cam);
  controls.target.copy(framed.look);
  camera.lookAt(framed.look);
  paintBeat(landK);
}
let gallery = null, benchDress = null, benchPlane = null;
function floatingWatch(id) {
  const W = WATCHES[id], cal = CALIBERS[W.caliber];
  const MV = buildMovement(M, images, W, cal);
  const CS = buildCase(M, W, MV.R);
  const root = new THREE.Group();
  root.add(CS.body);
  const mount = new THREE.Group();
  mount.rotation.z = Math.PI;
  mount.add(MV.mv);
  root.add(mount, CS.caseback);
  for (const s of Object.values(MV.screws)) if (s.ghost) s.ghost.visible = false;
  root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  root.rotation.x = Math.PI / 2;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  root.position.sub(box.getCenter(new THREE.Vector3()));
  const g = new THREE.Group();
  g.add(root);
  g.userData.parts = MV.parts;
  return g;
}
function addFloating(id) {
  if (!gallery || !id) return;
  try {
    const watch = floatingWatch(id);
    watch.userData.i = gallery.userData.items.length;
    gallery.add(watch);
    gallery.userData.items.push(watch);
  } catch (err) { console.warn('bóveda', id, err); }
}
function ensureGallery() {
  if (gallery || !M || !images) return;
  gallery = new THREE.Group();
  gallery.userData.items = [];
  gallery.userData.left = GALLERY_SPEC.map(s => s.id);
  scene.add(gallery);
  const key = new THREE.SpotLight(0xfff6e4, 14000, 280, 0.7, 0.5, 1.2);
  key.position.set(16, 36, 48);
  key.target.position.set(0, 0, 0);
  const fill = new THREE.PointLight(0xfff3dc, 600, 140, 2);
  fill.position.set(-24, 8, 36);
  gallery.add(key, key.target, fill);
  gallery.visible = false;
  addFloating(gallery.userData.left.shift());
}

function resize() {
  const r = stage.getBoundingClientRect(); applyDPR(r.width, r.height); renderer.setSize(r.width, r.height, false);
  renderer.domElement.style.width = r.width + 'px'; renderer.domElement.style.height = r.height + 'px';
  camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
  if (composer) composer.setSize(r.width, r.height);
  if (G) renderer.render(scene, camera);
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
  hideSeat();
  if (!G) return;
  // Al salir, la pieza ya no cuelga del reloj: scene.attach la dejó en la escena y el siguiente reloj heredaba el toque.
  for (const o of Object.values(G.parts)) if (o.parent === scene) scene.remove(o);
  for (const s of Object.values(G.MV.screws)) {
    if (s.obj && s.obj.parent === scene) scene.remove(s.obj);
    if (s.ghost && s.ghost.parent === scene) scene.remove(s.ghost);
  }
  scene.remove(G.root); scene.remove(G.mvObj); scene.remove(T.tg); scene.remove(T.holder); scene.remove(T.tray);
  G.extra.forEach(o => scene.remove(o));
  for (const o of [G.root, G.mvObj, T.tg, T.holder, T.tray]) o.traverse(c => { if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose(); });
}
function buildMovement(M, images, W, cal) {
  if (W.caliber === 'ZQ11') return buildZQ11(M, images, W, cal);
  if (W.caliber === 'ZX60') return buildZX60(M, images, W, cal);
  if (W.caliber === 'ZT18') return buildZT18(M, images, W, cal);
  if (W.grand) return buildGrand(M, images, W, cal);
  return buildZR28(M, images, W, cal);
}
function buildWorld(watchId, faultId, story, opts = {}) {
  disposeWorld();
  const W = WATCHES[watchId], cal = CALIBERS[W.caliber];
  const MV = buildMovement(M, images, W, cal);
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
  const E = createEngine({ watchId, faultId, story, empty: !!opts.empty });
  G = { W, cal, MV, CS, root, mvMount, mvObj: MV.mv, parts, home, E, slots: {}, nextSlot: 0, extra: [], amp: 0 };
  initFaultVisuals();
  if (opts.empty) layoutFromState();
  else refreshGhosts();
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
function seatScrew(sid) {
  const pack = G.MV.screws[sid], h = G.home[sid];
  if (!pack || !h) return;
  const obj = pack.obj;
  if (obj.parent !== h.parent) h.parent.attach(obj);
  obj.visible = true;
  obj.position.copy(h.pos);
  obj.quaternion.copy(h.quat);
  obj.scale.copy(h.scale);
  const th = obj.getObjectByName('thread'); if (th) th.visible = false;
}
async function fxTurn(sid, dir, prog, lift) {
  const pack = G.MV.screws[sid], obj = pack && pack.obj, h = G.home[sid];
  if (!obj || !h) return;
  obj.visible = true;
  if (obj.parent !== h.parent) h.parent.attach(obj);
  obj.scale.copy(h.scale);
  const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(h.quat);
  const along = lift == null ? (dir > 0 ? (1 - prog) * 0.9 : prog * 0.85) : lift * 0.9;
  const target = h.pos.clone().add(axis.multiplyScalar(along));
  const p0 = obj.position.clone();
  const spin = dir * (G.E.screws[sid].lh ? -1 : 1) * 1.2;
  const travel = p0.distanceTo(target) > 1.2;
  const go = (k) => {
    obj.position.lerpVectors(p0, target, k);
    obj.quaternion.copy(h.quat);
    obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), spin * k);
  };
  if (SPEED >= 0.2) await tween(D(travel ? 460 : 200), go); else go(1);
  if (floatingTool && sel === 'screwdriver') { const w = new THREE.Vector3(); obj.getWorldPosition(w); floatingTool.position.copy(w).add(new THREE.Vector3(0, 0.6, 0)); floatingTool.rotation.y += dir * 0.6; }
}
async function fxUnscrew(sid) { const obj = G.MV.screws[sid].obj; const th = obj.getObjectByName('thread'); if (th) th.visible = true; await moveWorld(obj, screwSlotPos(sid), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1), 600, 8); positionFloatingTool(); }
async function fxScrew(sid) { seatScrew(sid); positionFloatingTool(); }
async function fxLost(sid) { const obj = G.MV.screws[sid].obj; await moveWorld(obj, obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(60, -20, 50)), obj.quaternion.clone(), new THREE.Vector3(1, 1, 1), 500, 25); obj.visible = false; }
function refreshGhosts() {
  if (!G) return;
  for (const [sid, s] of Object.entries(G.MV.screws)) {
    const sc = G.E.screws[sid];
    const covered = G.E.P[sc.part].coveredBy.some(c => G.E.st[c] === 'in');
    const buried = G.E.st[sc.part] === 'in' && covered;
    if (sc.state === 'lost') s.obj.visible = false;
    else if (sc.state === 'in') s.obj.visible = !buried;
    else s.obj.visible = true;
    s.ghost.visible = sc.state !== 'in' && G.E.st[sc.part] === 'in' && !covered;
  }
}
function placeRemoved(id) {
  const obj = G.parts[id]; if (!obj) return;
  if (id === 'movement') {
    scene.attach(obj);
    obj.position.copy(HOLDER_POS).add(new THREE.Vector3(0, 8.4, 0));
    obj.quaternion.identity(); obj.scale.set(1, 1, 1); return;
  }
  const b = localBox(obj), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  const q = new THREE.Quaternion(); if (id === 'caseback') q.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  const s = Math.min(0.62, 14.5 / Math.max(sz.x, sz.z, 1));
  const dest = trayWorld(slotOf(id));
  const off = c.clone().multiplyScalar(s); if (id === 'caseback') off.set(off.x, -b.max.y * s, -off.z); else off.y = b.min.y * s;
  scene.attach(obj); obj.position.copy(dest).sub(new THREE.Vector3(off.x, off.y, off.z)); obj.quaternion.copy(q); obj.scale.set(s, s, s);
}
function placeScrewOut(sid) {
  const sc = G.E.screws[sid], obj = G.MV.screws[sid].obj;
  if (sc.state === 'lost') { obj.visible = false; return; }
  const th = obj.getObjectByName('thread'); if (th) th.visible = true;
  scene.attach(obj); obj.position.copy(screwSlotPos(sid)); obj.quaternion.identity(); obj.scale.set(1, 1, 1); obj.visible = true;
}
function placePartial(sid) {
  const sc = G.E.screws[sid], obj = G.MV.screws[sid].obj, h = G.home[sid];
  if (!h) return placeScrewOut(sid);
  if (obj.parent !== h.parent) h.parent.attach(obj);
  obj.visible = true;
  obj.scale.copy(h.scale);
  obj.quaternion.copy(h.quat);
  const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(h.quat);
  obj.position.copy(h.pos).add(axis.multiplyScalar(sc.prog * 0.9));
  const th = obj.getObjectByName('thread'); if (th) th.visible = sc.prog > 0.2;
}
function layoutFromState() {
  const E = G.E;
  if (E.st.movement === 'out') placeRemoved('movement');
  for (const id of E.history) if (id !== 'movement' && E.st[id] === 'out') placeRemoved(id);
  for (const id of Object.keys(E.st)) if (E.st[id] === 'out' && id !== 'movement' && !E.history.includes(id)) placeRemoved(id);
  for (const sid of Object.keys(E.screws)) {
    if (E.screws[sid].state === 'in' && !E.screws[sid].prog) seatScrew(sid);
    else if (E.screws[sid].state === 'in') placePartial(sid);
    else placeScrewOut(sid);
  }
  if (E.flags.flipped) { G.root.rotation.z = Math.PI; G.root.position.y = G.CS.dims.yBack; }
  if (E.st.movement === 'out' && E.flags.holderSide === 'dial') {
    const pl = E.quartz ? 0.9 : 1.2;
    G.mvObj.quaternion.setFromEuler(new THREE.Euler(0, 0, Math.PI));
    G.mvObj.position.y = HOLDER_POS.y + 8.4 + pl;
  }
  if (G.MV.protector) G.MV.protector.visible = !!E.flags.protector;
  if (E.replaced.has('coil') && G.MV.sub && G.MV.sub.coilMat) G.MV.sub.coilMat.color.set(0xd88a4a);
  applyReplacedLooks();
  refreshGhosts();
}
async function replayFaults() {
  for (const s of G.E.F.steps.slice(0, G.E.fstep)) if (s.fx) await faultFx(s.fx);
}
function stampTimer(elapsed = 0) { t0 = Date.now() - elapsed; const el = $('#timer'); if (el) el._t0 = t0; }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
function saveGame() {
  if (!G || !sessionLive || G.E.finished) { say('No hay un reloj a medias para guardar.'); return; }
  if (busy) { say('Espera a que la pieza termine de moverse.'); return; }
  if (!book.current()) { say('Entra con tu nombre para guardar el punto.'); return; }
  const job = { watch: G.E.W.id, fault: G.E.F.id, story: storyCase ? storyCase.id : '', mode, label: G.E.W.name + ' · ' + G.E.F.short, elapsed: Date.now() - t0, score: G.E.score, snap: G.E.exportState() };
  book.putSave(job);
  renderSaves();
  say(`<b>Punto guardado.</b> ${esc(job.label)}. La próxima vez, en el menú, toca Seguir.`, 'good');
}
async function resumeSave(key) {
  const s = book.saves().find(x => x.key === key);
  if (!s || !WATCHES[s.watch] || !FAULTS[s.fault]) { say('Ese punto ya no se puede abrir.'); return; }
  mode = s.mode === 'story' ? 'story' : s.mode === 'build' ? 'build' : 'play';
  storyCase = s.story ? (STORY.find(c => c.id === s.story) || null) : null;
  if (mode === 'story' && !storyCase) mode = 'play';
  buildWorld(s.watch, s.fault, storyCase);
  if (!G.E.importState(s.snap)) { say('No se pudo abrir ese punto.'); return; }
  layoutFromState();
  const prev = SPEED; SPEED = 0;
  try { await replayFaults(); } finally { SPEED = prev; }
  applyReplacedLooks();
  G.active = true; sessionLive = true; sel = null; started = true; busy = false;
  $('#partsBtn').hidden = false; closeParts();
  selectTool(null); stampTimer(s.elapsed || 0);
  $('#saveBtn').hidden = false; $('#intro').hidden = true; $('#endOverlay').hidden = true; $('#profile').hidden = true;
  hideSeat(); resize(); await setView(workView(), true); refresh();
  say(`<b>Sigues donde lo dejaste.</b> ${G.E.W.name}. ${G.E.goal().text}`);
}
function hideSeat() {
  heldId = null;
  if (!seatRing) return;
  if (seatRing.parent) seatRing.parent.remove(seatRing);
  seatRing.traverse(o => { if (o.geometry && o.material !== M.hit) { o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); } });
  seatRing = null;
}
function showSeat(id) {
  hideSeat();
  const h = G.home[id], obj = G.parts[id];
  if (!h || !obj) return;
  const b = localBox(obj), sz = b.getSize(new THREE.Vector3());
  const horiz = (isFinite(sz.x) && isFinite(sz.z)) ? Math.max(sz.x, sz.z) : 6;
  const rad = Math.max(2.2, Math.min(11, horiz * 0.38));
  const g = new THREE.Group();
  g.userData.seat = id;
  g.userData.seatPos = h.pos.clone();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, Math.max(0.32, rad * 0.11), 14, 56), new THREE.MeshBasicMaterial({ color: 0xffe7a0, toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.userData.seat = id; g.add(ring);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.35, rad * 0.08), 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff6d0, toneMapped: false }));
  dot.userData.seat = id; g.add(dot);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.2, rad * 1.2, 1.4, 24), M.hit);
  disc.userData.seat = id; disc.userData.isHit = true; g.add(disc);
  h.parent.add(g); seatRing = g; heldId = id; faceSeat();
}
function faceSeat() {
  if (!seatRing || !seatRing.parent) return;
  const parent = seatRing.parent;
  parent.updateWorldMatrix(true, false);
  const camLocal = camera.position.clone().applyMatrix4(new THREE.Matrix4().copy(parent.matrixWorld).invert());
  const dir = camLocal.sub(seatRing.userData.seatPos).normalize();
  seatRing.position.copy(seatRing.userData.seatPos).add(dir.clone().multiplyScalar(1.8));
  seatRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
}
function applyQuality() {
  renderer.toneMappingExposure = hq ? 1.08 : 1.02;
  scene.environmentIntensity = hq ? 1.15 : 1.05;
  scene.fog = hq ? null : baseFog;
  spot.intensity = hq ? 5200 : 4200; rim.intensity = hq ? 0.48 : 0.38;
  sun.shadow.radius = hq ? 1.4 : 2.6;
  const sz = hq ? 2048 : 1024;
  if (sun.shadow.mapSize.x !== sz) {
    sun.shadow.mapSize.set(sz, sz);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  const an = hq ? renderer.capabilities.getMaxAnisotropy() : 8;
  scene.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      for (const key of ['map', 'normalMap', 'roughnessMap']) if (m[key] && m[key].anisotropy !== an) m[key].anisotropy = an;
    }
  });
  const b = $('#hqBtn'); if (b) b.classList.toggle('on', hq);
  resize();
}
function setHQ(on, talk) {
  hq = !!on;
  try { localStorage.setItem('zarumei.hq', hq ? '1' : '0'); } catch (e) { /* privado */ }
  applyQuality();
  if (talk) say(hq ? 'Calidad <b>foto</b>: más nítido, sombra más fina y un desenfoque suave cuando usas la lupa. Sigue siendo la pantalla del teléfono, no un lienzo de 7680.' : 'Calidad normal: una sola pasada, para que el taller no se trabe.');
}
function setSeatMode(on, talk) {
  seatMode = !!on;
  try { localStorage.setItem('zarumei.seat', seatMode ? '1' : '0'); } catch (e) { /* privado */ }
  const b = $('#seatBtn'); if (b) { b.classList.toggle('on', seatMode); b.textContent = seatMode ? 'SITIO' : 'AUTO'; }
  if (!seatMode) hideSeat();
  renderTray();
  if (talk) say(seatMode ? 'Montaje <b>buscar sitio</b>: toca la pieza y luego el anillo dorado donde va.' : 'Montaje <b>automático</b>: tocar la pieza la encaja sola.');
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
function markBattery(dead) {
  const cell = G && G.MV.sub && G.MV.sub.batteryCell;
  if (!cell) return;
  const mats = cell.material;
  if (!mats[1].userData._cap) { mats[1] = mats[1].clone(); mats[1].userData._cap = true; }
  mats[1].color.set(dead ? 0x6e6a62 : 0xffffff);
  mats[1].emissive = new THREE.Color(dead ? 0x000000 : 0x243018);
  mats[1].emissiveIntensity = dead ? 0 : 0.35;
}
function applyReplacedLooks() {
  if (!G) return;
  const E = G.E, S = G.MV.sub || {};
  if (E.replaced.has('battery')) markBattery(false);
  else if (E.F.id === 'bateria' && E.fstep > 0) markBattery(true);
  if (E.replaced.has('coil') && S.coilMat) S.coilMat.color.set(0xd88a4a);
  if (E.replaced.has('balance') && S.pivot && S.staff) { S.pivot.rotation.z = 0; S.pivot.position.x = 0; S.pivot.material = S.staff.material; }
  if (E.replaced.has('barrel') && S.mainspring) { S.mainspring.material.color.set(0xc7ccd3); if (S.barrelDrum && S.barrelDrum.material) S.barrelDrum.material.color.set(0xd4d9df); }
}
function showNewPart(id) {
  applyReplacedLooks();
  const label = { battery: '🔋 Pila nueva · 1,55 V', coil: '🧵 Bobina nueva', balance: '✓ Volante nuevo', barrel: '✓ Muelle nuevo' }[id] || '✓ Pieza nueva';
  flashLabel(label);
}
async function faultFx(effect, on) {
  const S = G.MV.sub, f = G.E.F.id;
  if (effect === 'reveal') {
    if (f === 'aceiteSeco') { S.dirt.material.color.set(0x2a1c08); flashLabel('⚠ Aceite seco y oscurecido en el rubí'); }
    if (f === 'muelleDebil') { S.mainspring.visible = true; S.barrelDrum.material.color.set(0x6e5a44); flashLabel('⚠ Muelle real fatigado'); }
    if (f === 'ejeRoto') { S.pivot.material = S.pivot.material.clone(); S.pivot.material.color.set(0xff4444); S.pivot.material.emissive = new THREE.Color(0x550000); flashLabel('⚠ Pivote del eje roto'); }
    if (f === 'bobina') { S.coilMat.color.set(0x5a2e14); flashLabel('⚠ Bobina cortada (∞ Ω)'); }
    if (f === 'bateria') { markBattery(true); flashLabel('🔋 1,21 V · agotada'); }
  }
  if (effect === 'openSpring' && S.spring) { const s = S.spring; await tween(D(450), (k) => { s.rotation.y = -0.9 * k; s.position.x = -0.5 * k; }); }
  if (effect === 'clean' && S.dirt) { await tween(D(450), (k) => S.dirt.scale.setScalar(1 - k * 0.99)); S.dirt.visible = false; flashLabel('Rubí limpio'); }
  if (effect === 'oil') { if (f === 'aceiteSeco') { S.oil.visible = true; S.oil.scale.setScalar(0.01); await tween(D(450), (k) => S.oil.scale.setScalar(Math.max(0.01, k))); if (S.spring) { S.spring.rotation.y = 0; S.spring.position.x = 0; } flashLabel('✓ Gota de 9010 centrada'); } else flashLabel('✓ Lubricado'); }
  if (effect === 'replace') { if (f === 'ejeRoto') { S.pivot.rotation.z = 0; S.pivot.position.x = 0; S.pivot.material = G.MV.sub.staff.material; } if (f === 'muelleDebil') { S.mainspring.material.color.set(0xc7ccd3); S.barrelDrum.material.color.set(0xd4d9df); } flashLabel('✓ Pieza nueva'); }
  if (effect === 'regulate' && S.regulator) { const r0 = S.regulator.rotation.y; await tween(D(500), (k) => (S.regulator.rotation.y = r0 + (0.4 - r0) * k)); flashLabel('Raqueta → «−»'); }
  if (effect === 'demag') flashLabel('🧲 Desmagnetizado');
}
function sfx(kind) { if (SPEED >= 0.2) playSfx(kind); }
async function runFx(list) {
  for (const f of list) {
    if (f.fx === 'remove') { sfx('remove'); await fxRemove(f.part, f.inspect); if (f.inspect) await setView('mat'); }
    else if (f.fx === 'install') { sfx('install'); await fxInstall(f.part); if (f.part === 'battery' && G.E.replaced.has('battery')) flashLabel('🔋 Pila nueva SR626SW'); if (f.part === 'coil' && G.E.replaced.has('coil')) G.MV.sub.coilMat.color.set(0xd88a4a); }
    else if (f.fx === 'turn') { sfx('screw'); await fxTurn(f.screw, f.dir, f.prog, f.lift); }
    else if (f.fx === 'unscrew') { sfx('screw'); await fxUnscrew(f.screw); }
    else if (f.fx === 'screw') { sfx('seat'); await fxScrew(f.screw); }
    else if (f.fx === 'newpart') showNewPart(f.part);
    else if (f.fx === 'needSize') { document.querySelectorAll('.size').forEach(b => b.classList.toggle('hint', Math.abs(+b.dataset.size - f.size) < 0.01)); }
    else if (f.fx === 'lost') { sfx('bad'); await fxLost(f.screw); }
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
    else if (f.fx === 'wind') { sfx('wind'); const r = G.parts.ratchet; if (r && SPEED >= 0.2) { const r0 = r.rotation.y; await tween(D(700), (k) => (r.rotation.y = r0 - k * 4)); } }
    else if (f.fx === 'finish') { sfx('finish'); finish(); }
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
  if (id && talk && SPEED >= 0.2) playSfx('tool');
  if (heldId && G) { const p = G.E.P[heldId]; const need = (p && (p.placeTool || p.tool)); if (sel !== need) hideSeat(); }
  if (sel && talk) { const t = TOOLS.find(x => x.id === sel); say(`<b>${t.name}:</b> ${t.desc}<br><span class="small">Ahora toca la pieza${sel === 'screwdriver' ? ' o el tornillo' : ''} donde la quieres usar.</span>`); }
  renderTray();
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
    c.innerHTML = `${nm}${E.replaced.has(id) ? ' <i>nueva</i>' : ''}${pend ? ' 🛢?' : ''}`; c.classList.toggle('held', heldId === id); c.onclick = () => chipTap(id); el.appendChild(c);
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
function partLabel(id) { return G.E.name(id).replace(/^(el|la|las|los) /, '').split(' (')[0]; }
function renderParts() {
  const E = G.E;
  const service = SPARE_ORDER.filter(id => E.P[id] && (!SPARES[id].types || SPARES[id].types.includes(E.C.type)));
  const rest = E.C.parts.map(p => p.id).filter(id => id !== 'movement' && !service.includes(id));
  const row = (id, serviceRow) => {
    const sp = serviceRow ? SPARES[id] : null;
    const neu = E.replaced.has(id);
    const out = E.st[id] === 'out';
    const status = neu ? (out ? 'Nueva · en la bandeja' : 'Nueva · montada') : (out ? 'Vieja · en la bandeja' : 'Sigue en el reloj');
    return `<div class="partrow${neu ? ' new' : ''}${!neu && out ? ' hot' : ''}">
      <div><b>${esc(partLabel(id))}</b><span class="spec">${esc(sp ? sp.spec : 'repuesto')} · ${esc(status)}</span>${sp ? `<span class="why">${esc(sp.why)}</span>` : ''}</div>
      ${neu ? '' : `<button type="button" class="lux slim swap${!neu && out ? ' primary' : ''}" data-part="${esc(id)}">Poner nueva</button>`}
    </div>`;
  };
  $('#partsList').innerHTML = (service.length ? `<p class="cinzel">Servicio</p>${service.map(id => row(id, true)).join('')}` : '') + `<p class="cinzel">Todas las piezas</p>${rest.map(id => row(id, false)).join('')}`;
}
function openParts() { if (!started || !G) return; $('#partsPanel').hidden = false; renderParts(); }
function closeParts() { const p = $('#partsPanel'); if (p) p.hidden = true; }
function updateBar() {
  if (!G) return; const g = G.E.goal();
  $('#steptxt').textContent = G.E.finished ? '¡Trabajo terminado!' : g.text; $('#phase').textContent = g.phase;
  $('#progress i').style.width = (G.E.progress() * 100).toFixed(0) + '%';
  $('#score').textContent = '★ ' + G.E.score;
  const btn = $('#actionBtn'), E = G.E;
  const canWind = !E.quartz && E.flags.letdown && E.C.parts.filter(p => p.side !== 'case').every(p => E.st[p.id] === 'in');
  btn.hidden = !canWind; btn.textContent = '⚙️ Dar cuerda';
  const step = E.F.steps[E.fstep];
  const hot = !!(step && step.replace && E.st[step.replace] === 'out' && !E.replaced.has(step.replace));
  const pb = $('#partsBtn'); if (pb) pb.classList.toggle('hint', hot);
  updateFlipBtn();
}
function updateFlipBtn() {
  const f = $('#flipBtn'); if (!G) { f.hidden = true; return; }
  f.hidden = !(view === 'front' || view === 'back' || (view === 'holder' && G.E.flags.mvLoc === 'holder'));
  f.textContent = view === 'holder' ? '↻ Voltear movimiento' : '↻ Voltear reloj';
}
function say(html, kind) { const m = $('#msg'); m.innerHTML = html; m.className = kind || ''; }
function refresh() { refreshGhosts(); renderTray(); updateBar(); if ($('#partsPanel') && !$('#partsPanel').hidden) renderParts(); }

// ───────── acciones ─────────
async function act(r, opts = {}) {
  if (!r) return;
  if (r.msg) say(r.msg, r.kind === 'bad' ? 'bad' : r.kind === 'good' ? 'good' : '');
  if (r.kind === 'bad' && !r.fx.length) { sfx('bad'); stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
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
  if (hit.seat && heldId && hit.seat === heldId) { const pid = heldId; hideSeat(); await act(G.E.tapChip(pid, sel, size)); return; }
  if (hit.screw || hit.ghost) {
    const sid = hit.screw || hit.ghost;
    const sc = G.E.screws[sid];
    const part = sc && G.E.P[sc.part];
    // El centro de la rueda es el tornillo. Si ya salió, el fantasma no debe quedarse el toque: las pinzas levantan la pieza.
    if (sc && sc.state !== 'in' && G.E.st[sc.part] === 'in' && part && sel && sel === part.tool && sel !== 'screwdriver') {
      await act(G.E.tapPart(sc.part, sel, size)); return;
    }
    if (sel !== 'screwdriver') { await act(G.E.screwTurn(sid, sel, size, 0)); return; }
    await turnScrew(sid, 0.34); return;
  }
  // El protector cubre toda la esfera: con el movimiento en el soporte (lado esfera), cualquier toque lo pone/quita
  if (sel === 'dialProtector' && G.E.flags.mvLoc === 'holder' && G.E.flags.holderSide === 'dial' && G.E.st.dial === 'in' && !(hit.chain || []).some(c => c === 'timegrapher3d' || c === 'holderBench')) { await act(G.E.tapPart('dial', 'dialProtector', size)); return; }
  if (!hit.chain.length) return;
  const id = resolveTarget(hit.chain);
  if (id === 'timegrapher3d') { if (sel === 'timegrapher') await act(G.E.tapPart('watch', sel, size)); else say('El timegrapher LA FORY: elige la herramienta <b>Timegrapher</b> y toca el reloj.'); return; }
  if (id === 'holderBench') { say('El soporte de movimiento. Usa la herramienta <b>Soporte</b> sobre el movimiento para pasarlo aquí.'); return; }
  const E = G.E;
  if (E.P[id] && E.st[id] === 'out') { await chipTap(id); return; }
  if (heldId && seatMode) { await act(E.missSeat(heldId)); return; }
  await act(E.tapPart(id, sel, size));
}
async function chipTap(id, force) {
  if (!started || busy || !G) return;
  if (!force && seatMode) {
    const pre = G.E.placeCheck(id, sel, size);
    if (pre && pre.seek) {
      showSeat(id); renderTray(); sfx('seat');
      say(`Tienes <b>${G.E.name(id)}</b>. Busca el <b>anillo dorado</b> y tócalo: ahí se monta.`);
      const v = workView(); if (view === 'tray' || view === 'mat' || view === 'tg' || view === 'loupe') setView(v);
      return;
    }
    if (pre && pre.seek !== false) { await act(pre); return; }
  }
  if (heldId) hideSeat();
  await act(G.E.tapChip(id, sel, size));
}
async function turnScrew(sid, amount) { const r = G.E.screwTurn(sid, sel, size, amount); await act(r, { keepView: true }); return r; }
// ── teclado (escritorio / iPad con teclado) ──
window.addEventListener('keydown', (e) => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'Escape') { if (!$('#bqDetail').hidden) $('#bqBack').click(); else if (!$('#boutique').hidden) $('#bqClose').click(); else if (!$('#partsPanel').hidden) closeParts(); else if (!$('#tgPanel').hidden) { if (!$('#tgClose').disabled) $('#tgClose').click(); } else if (started) openMenu(); else if (G && G.active && $('#endOverlay').hidden) { $('#intro').hidden = true; started = true; } return; }
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
$('#partsBtn').onclick = () => { if (busy) return; openParts(); };
$('#partsClose').onclick = () => closeParts();
$('#partsList').onclick = async (e) => {
  const b = e.target.closest('.swap');
  if (!b || busy || !G) return;
  await act(G.E.swapPart(b.dataset.part));
};
$('#actionBtn').onclick = async () => { if (!busy && G) await act(G.E.button('wind')); };
$('#flipBtn').onclick = async () => { if (busy || !G) return; await act(G.E.button(view === 'holder' ? 'flipHolder' : 'flipWatch'), { keepView: true }); };
document.querySelectorAll('.vbtn[data-view]').forEach(b => b.onclick = () => { if (busy || !G) return; const v = b.dataset.view; setView(v === 'watch' ? (G.E.flags.flipped ? 'back' : 'front') : v); });
$('#seatBtn').onclick = () => { if (busy) return; setSeatMode(!seatMode, true); };
$('#hqBtn').onclick = () => { if (busy) return; setHQ(!hq, true); };
function syncMute() { const b = $('#muteBtn'); if (!b) return; b.classList.toggle('on', !isMuted()); b.textContent = isMuted() ? 'MUTE' : 'SON'; }
$('#muteBtn').onclick = () => { setMuted(!isMuted()); syncMute(); if (!isMuted() && SPEED >= 0.2) playSfx('tool'); };
syncMute();
document.addEventListener('pointerdown', () => unlockAudio(), { passive: true });
$('#hintBtn').onclick = () => {
  if (!started || busy || !G) return; const h = G.E.hint(); say(h.msg); updateBar(); const a = h.action; if (!a) return;
  if (a.replace) $('#partsBtn').classList.add('hint');
  if (a.tool) { document.querySelectorAll('.tool').forEach(b => b.classList.toggle('hint', b.dataset.tool === a.tool)); if (a.size) document.querySelectorAll('.size').forEach(b => b.classList.toggle('hint', +b.dataset.size === a.size)); }
  if (a.target && a.target.chip) { const c = document.querySelector(`.chip[data-chip="${a.target.chip}"]`); if (c) c.classList.add('hint'); if (seatMode && a.tool !== 'oiler' && a.tool !== 'screwdriver') say(h.msg + ' Luego toca el <b>anillo dorado</b> donde va.'); }
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
  for (const h of hits) { if (h.distance - firstD > 2.5) break; for (let n = h.object; n; n = n.parent) if (n.userData.seat) return { seat: n.userData.seat, chain: [] }; }
  for (const h of hits.slice(0, 8)) { if (h.distance - firstD > 8) break; for (let n = h.object; n; n = n.parent) { const sid = n.userData.screwId || n.userData.screwGhost; if (!sid || !G) continue; const sc = G.E.screws[sid]; if (G.E.P[sc.part].coveredBy.some(c => G.E.st[c] === 'in')) continue; return n.userData.screwId ? { screw: sid } : { ghost: sid }; } }
  // La pieza de encima gana: un toque que también cruza el rochet no se queda en el puente de abajo.
  const ids = [];
  for (const h of hits) {
    if (ids.length && h.distance - firstD > 8) break;
    let id = null;
    for (let n = h.object; n; n = n.parent) if (n.userData.partId) { id = n.userData.partId; break; }
    if (id) { if (!ids.includes(id)) ids.push(id); continue; }
    if (!h.object.userData.isHit) { if (!ids.length) return { chain: [] }; break; }
  }
  if (!ids.length) return { chain: [] };
  let best = ids[0];
  const P = G && G.E && G.E.P[best];
  if (P) {
    const cover = ids.find(id => id !== best && (P.coveredBy || []).includes(id) && G.E.st[id] === 'in');
    if (cover) best = cover;
  }
  return { chain: best === ids[0] ? ids : [best, ...ids] };
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
  if (h.seat && seatRing) return setHover(seatRing);
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
  if (mode === 'story' && storyCase) { const i = STORY.findIndex(c => c.id === storyCase.id); book.setStory(i + 1); }
  book.recordRun({ watch: E.W.id, fault: E.F.id, mode, story: storyCase ? storyCase.id : '', ms: e * 1000, score });
  if (mode === 'build') markBuildReady(E.W.id);
  sessionLive = false; $('#saveBtn').hidden = true;
  const next = mode === 'story' && storyCase ? STORY[STORY.findIndex(c => c.id === storyCase.id) + 1] : null;
  const built = mode === 'build';
  const pay = E.F.free ? 150 + score * 2 : 400 + score * 8; wallet.add(pay);
  $('#endCard').innerHTML = `<div class="cert"><small class="cinzel">Maison LA FORY · Certificado de servicio</small>
  <h2 class="foil">${built ? 'Reloj creado' : E.F.free ? 'Práctica completada' : 'Reloj reparado'}</h2><div class="stars">${stars}</div>
  <p class="serif"><b>${E.W.name}</b><br><i>${built ? 'Ensamblado desde la bandeja. Queda en Modo libre.' : E.F.name}</i></p><hr class="goldrule">
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
function openMenu() { started = false; closeParts(); $('#intro').hidden = false; renderMenu(); if (document.querySelector('.tab.on') && document.querySelector('.tab.on').dataset.tab === 'build') showTab('build'); }
function paintWho() {
  const u = book.current(), bar = $('#whoBar'); if (!bar) return;
  if (!u) { bar.hidden = true; return; }
  bar.hidden = false;
  $('#whoName').textContent = u.name;
  $('#whoRole').textContent = u.role === 'admin' ? 'Administrador' : u.role === 'guest' ? 'Invitado' : 'Relojero';
  $('#whoStat').textContent = `${u.stats.watches} relojes · más rápido ${book.fmtMs(u.stats.bestMs)} · ★ ${u.stats.bestScore}`;
}
function renderSaves() {
  const box = $('#saveList'); if (!box) return;
  const list = book.saves();
  if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<p class="cinzel">Continuar un reloj</p>` + list.map(s => {
    const name = (WATCHES[s.watch] && WATCHES[s.watch].name) || s.label;
    return `<div class="saveitem"><div><b>${esc(name)}</b><span class="small">${esc(s.label)} · ${book.fmtMs(s.elapsed)} · ★ ${s.score | 0}</span></div><span><button class="lux slim" type="button" data-resume="${esc(s.key)}">Seguir</button> <button class="lux slim" type="button" data-drop="${esc(s.key)}">Borrar</button></span></div>`;
  }).join('');
  box.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => resumeSave(b.dataset.resume));
  box.querySelectorAll('[data-drop]').forEach(b => b.onclick = () => { book.dropSave(b.dataset.drop); renderMenu(); });
}
function renderLive() {
  const live = $('#liveBox'); if (!live) return;
  if (!(sessionLive && G && !G.E.finished)) { live.hidden = true; live.innerHTML = ''; return; }
  live.hidden = false;
  live.innerHTML = `<p class="cinzel">En el banco ahora</p><p class="serif" style="margin:0;font-size:20px">${esc(G.E.W.name)}</p><div class="row" style="margin-top:8px"><button class="lux primary" id="liveBack" type="button">Seguir</button><button class="lux" id="liveSave" type="button">Guardar punto</button></div>`;
  $('#liveBack').onclick = () => { $('#intro').hidden = true; started = true; };
  $('#liveSave').onclick = () => saveGame();
}
function openProfile() {
  const u = book.current(); if (!u) { showGate(); return; }
  const st = u.stats;
  const runs = (st.runs || []).slice(0, 8).map(r => `<div class="saveitem"><div>${esc((WATCHES[r.watch] && WATCHES[r.watch].name) || r.watch)} <span class="small">${esc((FAULTS[r.fault] && FAULTS[r.fault].short) || r.fault)}</span></div><b>${book.fmtMs(r.ms)} · ★ ${r.score}</b></div>`).join('') || '<p class="small">Todavía no terminas un reloj.</p>';
  const bests = Object.entries(st.byWatch || {}).map(([id, b]) => `<div class="saveitem"><div>${esc((WATCHES[id] && WATCHES[id].name) || id)}</div><b>${book.fmtMs(b.ms)} · ★ ${b.score}</b></div>`).join('');
  let admin = '';
  if (u.role === 'admin') {
    admin = `<hr class="goldrule"><p class="cinzel">Relojeros de este teléfono</p><div class="admin"><table><tr><th>Nombre</th><th></th><th>Rápido</th><th>★</th><th></th></tr>` +
      book.roster().map(p => `<tr><td>${esc(p.name)}<div class="small">${esc(p.role)}</div></td><td>${p.stats.watches}</td><td>${book.fmtMs(p.stats.bestMs)}</td><td>${p.stats.bestScore}</td><td>${p.id !== u.id ? `<button class="lux slim" type="button" data-del="${esc(p.id)}">Borrar</button>` : ''}</td></tr>`).join('') +
      `</table></div>`;
  }
  $('#profileCard').innerHTML = `<div class="cinzel">${u.role === 'admin' ? 'Administrador' : u.role === 'guest' ? 'Invitado' : 'Relojero'}</div>
    <h2 class="foil" style="margin:4px 0 8px;font-family:var(--serif);font-weight:500">${esc(u.name)}</h2>
    ${u.role === 'guest' ? '<p class="small">El invitado se queda en este teléfono. Crea una cuenta si quieres tu propio nombre y tu propia historia.</p>' : ''}
    <div class="kv"><span>Relojes terminados</span><b>${st.watches}</b><span>El más rápido</span><b>${book.fmtMs(st.bestMs)}</b><span>Mejor puntuación</span><b>★ ${st.bestScore}</b><span>Puntos acumulados</span><b>${st.totalScore}</b><span>Tiempo en el banco</span><b>${book.fmtMs(st.totalMs)}</b></div>
    ${bests ? `<hr class="goldrule"><p class="cinzel">Mejor tiempo por reloj</p>${bests}` : ''}
    <hr class="goldrule"><p class="cinzel">Últimos trabajos</p>${runs}
    ${admin}
    <div class="row"><button class="lux" id="profClose" type="button">Cerrar</button><button class="lux" id="profOut" type="button">Salir</button></div>`;
  $('#profile').hidden = false;
  $('#profClose').onclick = () => { $('#profile').hidden = true; };
  $('#profOut').onclick = () => { book.logout(); sessionLive = false; $('#saveBtn').hidden = true; $('#profile').hidden = true; showGate(); };
  $('#profileCard').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const r = book.removeUser(b.dataset.del); if (r.err) say(r.err); else openProfile(); });
}
function showGate() {
  openLanding();
  requestAnimationFrame(() => { window.scrollTo(0, document.documentElement.scrollHeight); landK = 1; });
}
function enterApp() {
  portraitsWanted = true;
  $('#profile').hidden = true; $('#intro').hidden = false; renderMenu();
}
function dressCard(b, watchId) {
  if (!b.querySelector('.pair')) {
    const p = document.createElement('div');
    p.className = 'pair';
    p.dataset.watch = watchId;
    p.innerHTML = '<div class="face"><img alt=""></div><div class="boxshot"><img alt=""></div>';
    b.prepend(p);
  }
  b.classList.add('arrive');
}
function paintPortrait(id, shot) {
  document.querySelectorAll(`.pair[data-watch="${id}"]`).forEach(p => {
    const face = p.querySelector('.face img');
    const box = p.querySelector('.boxshot img');
    if (shot.face && face) { face.src = shot.face; face.classList.add('in'); }
    if (shot.box && box) { box.src = shot.box; box.classList.add('in'); }
    const card = p.closest('.arrive');
    if (!card || card.dataset.shown) return;
    card.dataset.shown = '1';
    const to = arrivalOf(card);
    card.style.setProperty('--in', '0');
    if (face) void face.offsetWidth;
    requestAnimationFrame(() => card.style.setProperty('--in', to.toFixed(3)));
  });
}
function arrivalOf(el) {
  const root = document.querySelector('#intro .card');
  if (!root) return 1;
  const view = root.getBoundingClientRect();
  const start = view.bottom;
  const done = view.top + view.height * 0.62;
  const top = el.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, (start - top) / Math.max(1, start - done)));
}
function placeArrivals() {
  const root = document.querySelector('#intro .card');
  if (!root) return;
  root.querySelectorAll('.arrive').forEach(el => {
    if (el.closest('[hidden]')) return;
    el.style.setProperty('--in', arrivalOf(el).toFixed(3));
  });
}
let revealIO = null;
function bindReveals() {
  const root = document.querySelector('#intro .card');
  if (!root) return;
  if (!revealIO) revealIO = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) e.target.classList.add('show'); }, { root, threshold: 0.15 });
  root.querySelectorAll('.reveal').forEach(el => { if (!el.dataset.seen) { el.dataset.seen = '1'; revealIO.observe(el); } });
}
function renderMenu() {
  paintWho(); renderSaves(); renderLive();
  const done = book.storyDone();
  const list = $('#caseList'); list.innerHTML = '';
  STORY.forEach((c, i) => {
    const W = WATCHES[c.watch], F = FAULTS[c.fault], locked = i > done;
    const b = document.createElement('button'); b.className = 'casecard' + (locked ? ' locked' : ''); b.dataset.case = c.id;
    const kind = CALIBERS[W.caliber].type;
    const kindLabel = kind === 'auto' ? 'automático' : kind === 'tourbillon' ? 'turbillón' : 'cuarzo';
    b.innerHTML = `<div><b>${locked ? '🔒 ' : ''}${c.title}</b><span>${W.name} · ${CALIBERS[W.caliber].name}</span></div><div class="ticket">CLIENTE: ${c.cliente}<br>RELOJ: ${W.name}<br>CALIBRE: ${CALIBERS[W.caliber].name} (${kindLabel})<br>QUEJA: <b>${F.symptom}</b></div>`;
    dressCard(b, c.watch);
    b.onclick = () => { if (locked) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; } startStory(c.id); }; list.appendChild(b);
  });
  const wl = $('#watchList'); wl.innerHTML = '';
  document.querySelectorAll('#habanaList [data-go], #astralList [data-go], #grandList [data-go], #maisonList [data-go]').forEach(b => {
    dressCard(b, b.dataset.go);
    b.classList.toggle('on', b.dataset.go === playWatch);
    b.onclick = () => pickWatch(b.dataset.go);
  });
  Object.values(WATCHES).filter(w => !w.custom && w.caliber !== 'ZT18' && !w.grand && !w.maison && !w.opera).forEach(w => { const b = document.createElement('button'); b.className = 'wcard' + (playWatch === w.id ? ' on' : ''); b.dataset.watch = w.id; b.innerHTML = `<div><b>${w.name}</b><span>${w.blurb}</span><small>${CALIBERS[w.caliber].name} · ${CALIBERS[w.caliber].desc}</small></div>`; dressCard(b, w.id); b.onclick = () => pickWatch(w.id); wl.appendChild(b); });
  renderCustoms();
  renderFaults();
  if (portraitsWanted) {
    const ids = [...new Set([...STORY.map(c => c.watch), ...Object.keys(WATCHES).filter(id => !WATCHES[id].custom)])];
    queuePortraits(ids, paintPortrait);
  }
  requestAnimationFrame(placeArrivals);
}
function renderFaults() {
  const fl = $('#faultList'); if (!fl) return;
  fl.innerHTML = '';
  if (!WATCHES[playWatch]) playWatch = 'miami';
  const type = CALIBERS[WATCHES[playWatch].caliber].type;
  if (!FAULTS[playFault].calibers.includes(type)) playFault = 'sinFalla';
  Object.values(FAULTS).filter(f => f.calibers.includes(type)).forEach(f => {
    const b = document.createElement('button'); b.className = 'fchip' + (playFault === f.id ? ' on' : ''); b.dataset.fault = f.id; b.textContent = f.name;
    b.onclick = () => { playFault = f.id; renderFaults(); };
    fl.appendChild(b);
  });
}
function pickWatch(id) {
  if (!WATCHES[id] || id === DRAFT_ID) return;
  playWatch = id;
  document.querySelectorAll('#playPane .wcard').forEach(b => b.classList.toggle('on', (b.dataset.go || b.dataset.watch) === id));
  renderFaults();
}
// ── Modo Build: configurador, vista previa en la escena y montaje desde la bandeja ──
const buildSpec = { case: 'diver', metal: 'steel', dial: 'cuba', hands: 'baton', caliber: 'ZR28' };
let buildNameEdited = false, previewTimer = 0, previewGen = 0;
function buildNameValue() {
  const input = $('#buildName');
  return cleanName(buildNameEdited && input ? input.value : suggestedName(buildSpec));
}
function renderCustoms() {
  const box = $('#customList'); if (!box) return;
  const mine = Object.values(WATCHES).filter(w => w.custom && w.id !== DRAFT_ID && isBuildReady(w.id));
  if (!mine.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<p class="cinzel" style="margin-top:12px">Tus relojes</p>` + mine.map(w => `<button type="button" class="wcard${playWatch === w.id ? ' on' : ''}" data-watch="${w.id}"><b>${esc(w.name)}</b><span>${esc(w.blurb)}</span><small>${CALIBERS[w.caliber].name}</small></button>`).join('');
  box.querySelectorAll('.wcard').forEach(b => b.onclick = () => pickWatch(b.dataset.watch));
  const del = document.createElement('div');
  del.className = 'optrow';
  mine.forEach(w => {
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'fchip'; x.textContent = 'Borrar ' + w.name;
    x.onclick = () => { forgetBuild(w.id); if (playWatch === w.id) playWatch = 'miami'; renderMenu(); };
    del.appendChild(x);
  });
  box.appendChild(del);
}
function renderBuild() {
  const host = $('#buildOpts'); if (!host || host.childElementCount) { syncBuildChips(); return; }
  const groups = [['case', 'Caja'], ['metal', 'Metal'], ['dial', 'Esfera'], ['hands', 'Agujas'], ['caliber', 'Movimiento']];
  host.innerHTML = groups.map(([k, title]) => `<p class="cinzel">${title}</p><div class="optrow" data-group="${k}">${BUILD_OPTS[k].map(o => `<button type="button" class="fchip" data-k="${k}" data-v="${o.id}">${o.label}${o.hint ? `<small>${o.hint}</small>` : ''}</button>`).join('')}</div>`).join('');
  host.querySelectorAll('.fchip').forEach(b => b.onclick = () => { buildSpec[b.dataset.k] = b.dataset.v; if (!buildNameEdited && $('#buildName')) $('#buildName').value = suggestedName(buildSpec); syncBuildChips(); schedulePreview(); });
  syncBuildChips();
}
function syncBuildChips() {
  if (!dialFits(buildSpec.caliber, buildSpec.dial)) {
    const next = BUILD_OPTS.dial.find(d => dialFits(buildSpec.caliber, d.id));
    if (next) buildSpec.dial = next.id;
  }
  document.querySelectorAll('#buildOpts .fchip').forEach(b => {
    const hide = b.dataset.k === 'dial' && !dialFits(buildSpec.caliber, b.dataset.v);
    b.hidden = hide;
    b.classList.toggle('on', !hide && buildSpec[b.dataset.k] === b.dataset.v);
  });
  const note = $('#buildNote');
  if (note) note.textContent = sessionLive && G && !G.E.finished ? 'Hay un reloj en el banco. Montar empieza uno nuevo.' : 'Arriba ves el reloj terminado. Al montar, esa misma pieza nace desarmada.';
}
function benchBusy() { return !!(sessionLive && G && !G.E.finished); }
function schedulePreview() {
  const gen = ++previewGen;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => runPreview(gen), 180);
}
async function runPreview(gen) {
  if (gen !== previewGen || benchBusy() || !M) return;
  const w = watchFromSpec(DRAFT_ID, buildSpec, buildNameValue());
  if (!w) return;
  WATCHES[DRAFT_ID] = w;
  buildWorld(DRAFT_ID, 'sinFalla', null);
  if (gen !== previewGen) return;
  await setView('front', true);
}
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
  $('#storyPane').hidden = tab !== 'story';
  $('#playPane').hidden = tab !== 'play';
  const build = $('#buildPane'); if (build) build.hidden = tab !== 'build';
  const peek = tab === 'build' && !benchBusy();
  document.body.classList.toggle('buildpeek', peek);
  if (tab === 'build') { renderBuild(); syncBuildChips(); if (peek) schedulePreview(); }
  requestAnimationFrame(placeArrivals);
}
function startBuild() {
  const id = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36);
  const w = rememberBuild(id, buildSpec, buildNameValue());
  if (!w) { say('Esa combinación no se puede construir.'); return; }
  clearTimeout(previewTimer); previewGen++;
  document.body.classList.remove('buildpeek');
  mode = 'build'; storyCase = null;
  return begin(id, 'sinFalla', null, { empty: true });
}
let playWatch = 'miami', playFault = 'sinFalla', portraitsWanted = false;
document.querySelectorAll('.tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
$('#playBtn').onclick = () => startPlay(playWatch, playFault);
const buildBtn = $('#buildBtn'); if (buildBtn) buildBtn.onclick = () => startBuild();
const buildNameInput = $('#buildName');
if (buildNameInput) {
  buildNameInput.value = suggestedName(buildSpec);
  buildNameInput.addEventListener('input', () => { buildNameEdited = true; schedulePreview(); });
}
$('#saveBtn').onclick = () => saveGame();
$('#whoProfile').onclick = () => openProfile();
$('#whoOut').onclick = () => { book.logout(); sessionLive = false; $('#saveBtn').hidden = true; showGate(); };
$('#gateIn').onclick = () => { const r = book.login($('#gateName').value, $('#gatePass').value); if (r.err) { $('#gateErr').textContent = r.err; return; } closeLanding(); };
$('#gateNew').onclick = () => { const r = book.register($('#gateName').value, $('#gatePass').value); if (r.err) { $('#gateErr').textContent = r.err; return; } closeLanding(); };
$('#gateGuest').onclick = () => { book.enterGuest(); closeLanding(); };
$('#gatePass').addEventListener('keydown', e => { if (e.key === 'Enter') $('#gateIn').click(); });
function liftGate(el) {
  const run = () => {
    const vv = window.visualViewport;
    const top = vv ? vv.offsetTop : 0;
    const h = vv ? vv.height : window.innerHeight;
    const r = el.getBoundingClientRect();
    window.scrollBy(0, r.top - (top + h * 0.28));
  };
  setTimeout(run, 60);
  setTimeout(run, 340);
  setTimeout(run, 700);
}
for (const id of ['gateName', 'gatePass']) $('#' + id).addEventListener('focus', () => liftGate($('#' + id)));
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => {
  const el = document.activeElement;
  if (el && (el.id === 'gateName' || el.id === 'gatePass')) liftGate(el);
});
$('#gateName').addEventListener('keydown', e => { if (e.key === 'Enter') $('#gatePass').focus(); });
$('#landing').addEventListener('scroll', () => {
  const el = $('#landing'), max = el.scrollHeight - el.clientHeight;
  landK = max > 0 ? el.scrollTop / max : 0;
}, { passive: true });
document.querySelector('#intro .card').addEventListener('scroll', () => {
  const el = document.querySelector('#intro .card'), max = el.scrollHeight - el.clientHeight;
  const bar = $('#menuBar'); if (bar) bar.style.height = (max > 0 ? el.scrollTop / max * 100 : 0).toFixed(1) + '%';
  placeArrivals();
}, { passive: true });
$('#landing').addEventListener('pointermove', e => {
  landTilt.x = (e.clientX / window.innerWidth - 0.5) * 0.2;
  landTilt.y = (e.clientY / window.innerHeight - 0.5) * 0.1;
});
$('#landSkip').onclick = () => closeLanding();
$('#landContinue').onclick = () => closeLanding();
$('#landSwitch').onclick = () => { book.logout(); paintLandingAuth(); window.scrollTo(0, document.documentElement.scrollHeight); };
async function begin(watchId, faultId, story, opts = {}) {
  buildWorld(watchId, faultId, story, opts); G.active = true; sessionLive = true;
  sel = null; selectTool(null); started = true; busy = false; stampTimer(0);
  $('#saveBtn').hidden = false; $('#partsBtn').hidden = false; closeParts(); $('#intro').hidden = true; $('#endOverlay').hidden = true; resize();
  await setView(opts.empty ? 'tray' : 'front', true); refresh();
  const W = WATCHES[watchId], F = FAULTS[faultId];
  const seatNote = seatMode ? ' Al montar, toca la pieza y luego el anillo dorado.' : '';
  say(story ? `<b>${story.title}</b> — ${W.name}. ${story.intro}${seatNote}` : mode === 'build'
    ? `<b>Build</b> — ${W.name}. La caja está vacía. El movimiento está en el soporte y el resto espera en la bandeja. La pista dice el siguiente paso.${seatNote}`
    : `<b>Modo libre</b> — ${W.name} · ${F.name}. ${F.free ? 'Desarma lo que quieras y vuelve a montarlo todo.' : 'Diagnostica, repara, monta y prueba.'}${seatNote}`);
}
function startStory(id) { mode = 'story'; storyCase = STORY.find(c => c.id === id); return begin(storyCase.watch, storyCase.fault, storyCase); }
function startPlay(w, f) { mode = 'play'; storyCase = null; return begin(w, f, null); }

async function init() {
  book.boot();
  loadBuilds();
  images = await loadAllImages(); M = makeMaterials(); initBoutique({ M, images });
  document.querySelectorAll('[data-open="boutique"]').forEach(b => b.onclick = () => openBoutique());
  try { await Promise.all(['600 20px Cinzel', '500 20px "Cormorant Garamond"', '400 14px Jost'].map(f => document.fonts.load(f))); } catch (e) { /* fuentes de reserva */ }
  // banco de ónix, tapete de cuero con pespunte dorado y alfombrilla de terciopelo verde
  benchPlane = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshPhysicalMaterial({ map: onyxTexture(), roughness: 0.2, metalness: 0.22, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.55 })); benchPlane.rotation.x = -Math.PI / 2; benchPlane.position.y = -0.2; benchPlane.receiveShadow = true; scene.add(benchPlane);
  benchDress = new THREE.Group(); scene.add(benchDress);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(220, 1.2, 170), [0, 0, 1, 0, 0, 0].map(i => i ? new THREE.MeshPhysicalMaterial({ map: leatherTexture(images.logo), roughness: 0.72, metalness: 0.02, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new THREE.Color(0x3a2a18) }) : new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.7 }))); mat.position.set(-6, -0.6, 6); mat.receiveShadow = true; benchDress.add(mat);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(222, 0.6, 172), new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 1, roughness: 0.28 })); rim.position.set(-6, -0.9, 6); benchDress.add(rim);
  const insp = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.5, 40), new THREE.MeshStandardMaterial({ map: velvetTexture('#0e2a21'), roughness: 1 })); insp.position.copy(INSPECT_POS).add(new THREE.Vector3(0, -0.3, 0)); insp.receiveShadow = true; benchDress.add(insp);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(168, 122), new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.92, metalness: 0 }));
  cloth.rotation.x = -Math.PI / 2; cloth.position.set(-6, 0.06, 6); cloth.receiveShadow = true; benchDress.add(cloth);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.set(0, 0.08, 4); benchDress.add(contact);
  $('#introLogo').src = images.logo.src; $('#bqLogo').src = images.logo.src; $('#headLogo').src = images.badge.src; $('#toolheadLogo').src = images.logo.src;
  document.querySelectorAll('.tool .stamp').forEach(i => (i.src = images.badge.src));
  buildWorld('miami', 'aceiteSeco', null); setSize(1.0); setSeatMode(seatMode, false); setHQ(hq, false);
  if (navigator.webdriver && !book.current()) book.enterGuest();
  portraitsWanted = !!navigator.webdriver;
  renderMenu(); resize(); await setView('front', true);
  if (navigator.webdriver) { landingOn = false; $('#landing').hidden = true; $('#landScroll').hidden = true; document.documentElement.classList.remove('land'); document.body.classList.remove('land'); }
  else openLanding();
  $('#loading').hidden = true;
  requestAnimationFrame(loop);
}

// ───────── bucle ─────────
const clock = new THREE.Clock(); let frames = 0, fpsT = performance.now(), fps = 0;
function loop(now) {
  runTweens(now);
  const t = clock.getElapsedTime();
  if (G) {
    const E = G.E, run = E.running(), P = G.parts;
    const d = new Date(); const quartz = E.quartz;
    const sec = quartz ? d.getSeconds() : d.getSeconds() + Math.floor(d.getMilliseconds() / 125) / 8, mn = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + mn / 60, h24 = d.getHours() + mn / 60;
    if (run) { for (const [id, v] of [['secHand', sec / 60], ['minHand', mn / 60], ['hourHand', hr / 12], ['milHand', h24 / 24], ['depthHand', (Math.sin(t * 0.35) * 0.5 + 0.5) * 0.42]]) { const r = P[id] && P[id].getObjectByName('rot'); if (r && E.st[id] === 'in') r.rotation.y = -v * Math.PI * 2; } }
    const needle = P.compassNeedle && P.compassNeedle.getObjectByName('rot'); if (needle && E.st.compassNeedle === 'in') needle.rotation.y = Math.sin(t * 0.25) * 0.18;
    if (P.moonDisc && E.st.moonDisc === 'in') P.moonDisc.rotation.y = t * 0.05;
    if (G.MV.wheel) { const amp = run ? THREE.MathUtils.degToRad(E.amplitude()) : 0; G.MV.wheel.rotation.y = run ? amp * Math.sin(t * Math.PI * 8) : G.MV.wheel.rotation.y * 0.92; }
    if (run && P.escapeWheel) P.escapeWheel.rotation.y = -Math.floor(t * 8) * (Math.PI * 2 / 20) / 2;
    if (run && G.MV.kind === 'tourbillon') {
      for (const [id, spd] of [['balance', 0.85], ['diamondCage', -0.45], ['bearCage', 0.28], ['colibri', 0.9], ['bee', -1.3]]) {
        const spin = P[id] && P[id].getObjectByName('cageSpin');
        if (spin && E.st[id] === 'in') spin.rotation.y = t * spd;
      }
    }
    if (run && quartz && P.stepRotor) P.stepRotor.rotation.y = d.getSeconds() * Math.PI;
    if (started && SPEED >= 0.2 && run) pulseSfx(t, quartz);
  }
  if (floatingTool && floatingTool.userData.base && !tweens.length && !hold) { floatingTool.rotation.y = t * 0.6; floatingTool.position.y = floatingTool.userData.base.y + Math.sin(t * 2) * 0.4; }
  if (seatRing) { faceSeat(); seatRing.scale.setScalar(1 + Math.sin(t * 5) * 0.05); }
  if (landingOn) driveLanding(t);
  else controls.update();
  if (!landingOn && hq && view === 'loupe' && loupeTarget) {
    ensureDof();
    const dist = camera.position.distanceTo(controls.target);
    bokehPass.uniforms.focus.value = dist;
    bokehPass.uniforms.aperture.value = 0.00015;
    bokehPass.uniforms.maxblur.value = 0.0045;
    composer.render();
  } else renderer.render(scene, camera);
  frames++; if (now - fpsT > 1000) { fps = frames * 1000 / (now - fpsT); frames = 0; fpsT = now; }
  requestAnimationFrame(loop);
}

// ───────── API de pruebas (Playwright) ─────────
function screenOfObj(o, dy = 0) { const p = new THREE.Vector3(); let hp = null; o.traverse(c => { if (!hp && c.userData.isHit && visibleChain(c)) hp = c; }); (hp || o).getWorldPosition(p); p.y += dy; p.project(camera); const r = renderer.domElement.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; }
window.__game = {
  get started() { return started; }, get busy() { return busy || !!tweens.length; }, get view() { return view; }, get fps() { return fps; },
  get state() { if (!G) return null; const E = G.E; return { watch: E.W.id, fault: E.F.id, score: E.score, finished: E.finished, goal: E.goal(), flags: { ...E.flags }, stats: { ...E.stats }, out: Object.keys(E.st).filter(k => E.st[k] === 'out'), screwsOut: Object.values(E.screws).filter(s => s.state !== 'in').length, fstep: E.fstep }; },
  get info() { const i = renderer.info.render; return { calls: i.calls, triangles: i.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
  startStory, startPlay, openMenu, openLanding, closeLanding, setSpeed: (s) => (SPEED = s), setView: (v) => setView(v),
  selectTool: (id) => selectTool(id), setSize,
  suggest: () => G.E.suggest(), describe: (a) => G.E.describe(a),
  screwPose(sid) {
    const pack = G.MV.screws[sid], h = G.home[sid], sc = G.E.screws[sid];
    if (!pack || !h || !sc) return null;
    const wp = new THREE.Vector3(), hw = new THREE.Vector3();
    pack.obj.getWorldPosition(wp);
    h.parent.updateWorldMatrix(true, false);
    hw.copy(h.pos).applyMatrix4(h.parent.matrixWorld);
    return { state: sc.state, prog: sc.prog, dist: +wp.distanceTo(hw).toFixed(3), parent: pack.obj.parent === h.parent, ang: +pack.obj.quaternion.angleTo(h.quat).toFixed(4) };
  },
  // ejecuta una acción como la haría el jugador (misma ruta de código que los toques)
  async do(a) {
    if (a.replace) return act(G.E.swapPart(a.replace));
    if (a.button) { if (a.button === 'wind') $('#actionBtn').click(); else { await setView(a.button === 'flipHolder' ? 'holder' : workView()); $('#flipBtn').click(); } return; }
    if (a.tool !== sel) selectTool(a.tool); if (a.size) setSize(a.size);
    if (a.target.screw) { let r; do { r = await turnScrew(a.target.screw, 0.34); } while (r.kind === 'turn'); return; }
    if (a.target.chip) return chipTap(a.target.chip, true);
    const id = a.target.sub || a.target.part; return handleTap(id === 'watch' ? { chain: ['watch'] } : { chain: a.target.sub ? [a.target.sub, a.target.part] : [id] });
  },
  screenOf(target) {
    if (target.seat) { if (!seatRing) return null; return screenOfObj(seatRing, 0); }
    if (target.screw) { const s = G.MV.screws[target.screw]; return screenOfObj(G.E.screws[target.screw].state === 'in' ? s.obj : s.ghost); }
    if (target.chip) { const c = document.querySelector(`.chip[data-chip="${target.chip}"]`); if (!c) return null; c.scrollIntoView({ inline: 'center' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, chip: true }; }
    const id = target.sub || target.part; const o = id === 'watch' ? G.root : (G.parts[id] || (G.MV.sub && G.MV.sub[id])); if (!o) return null; return screenOfObj(o, id === 'jewel' ? 0.1 : 0);
  },
  pick: (x, y) => pick(x, y), workView, hoverAt, get hovered() { return hovered === 'watch' ? 'watch' : hovered ? 'part' : null; }, get dpr() { return renderer.getPixelRatio(); }, get hq() { return hq; }, get seat() { return seatMode; }, setHQ, setSeat: setSeatMode, fsSupported, toggleFullscreen, get glOK() { return !!renderer.getContext(); }
};
init().catch(err => { console.error(err); $('#loading').textContent = 'Error al cargar: ' + err.message; });
