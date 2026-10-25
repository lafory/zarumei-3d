// Sonido del taller, sintetizado (sin archivos). El iPhone solo suena tras un toque.
let ctx, master, noiseBuf, muted = false, nextPulse = 0;
try { muted = localStorage.getItem('zarumei.mute') === '1'; } catch (e) { /* privado */ }

function ac() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch (e) { return null; } // iOS puede negar el dispositivo de audio
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    const n = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = n;
  }
  return ctx;
}
export function unlock() {
  const c = ac();
  if (c && c.state === 'suspended') { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* iOS: InvalidStateError al arrancar el audio */ } }
}
export function isMuted() { return muted; }
export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem('zarumei.mute', muted ? '1' : '0'); } catch (e) { /* privado */ }
  if (master) master.gain.value = muted ? 0 : 0.8;
  if (!muted) unlock();
}

function burst(freq, dur, peak, type, slide) {
  const c = ac();
  if (!c || muted) return;
  const t = c.currentTime;
  const g = c.createGain();
  g.connect(master);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const o = c.createOscillator();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function click(freq, dur, peak) {
  const c = ac();
  if (!c || muted || !noiseBuf) return;
  const t = c.currentTime;
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 0.7;
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur);
}

const FX = {
  tick: () => { click(3200, 0.02, 0.045); burst(2100, 0.025, 0.02, 'square'); },
  tock: () => { click(1400, 0.03, 0.04); burst(880, 0.04, 0.03, 'triangle'); },
  screw: () => click(1800, 0.035, 0.08),
  seat: () => click(900, 0.05, 0.07),
  install: () => { click(640, 0.08, 0.1); burst(520, 0.12, 0.04, 'sine', 260); },
  remove: () => { click(420, 0.07, 0.07); burst(300, 0.1, 0.03, 'triangle', 140); },
  bad: () => burst(140, 0.16, 0.06, 'sawtooth', 70),
  wind: () => { click(2400, 0.04, 0.05); burst(180, 0.35, 0.04, 'sawtooth', 90); },
  tool: () => click(2200, 0.02, 0.035),
  finish: () => { burst(523, 0.22, 0.05, 'sine'); burst(784, 0.28, 0.04, 'sine'); }
};
export function play(kind) { const fn = FX[kind]; if (fn) fn(); }
export function pulse(t, quartz) {
  const step = quartz ? 1 : 0.25;
  if (t < nextPulse) return;
  nextPulse = t + step;
  play(quartz ? 'tock' : 'tick');
}
