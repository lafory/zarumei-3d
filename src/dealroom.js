// Deal Room. El taller sigue en localStorage. Aquí solo se abre una sala con código
// para que dos teléfonos se pasen UN reloj. El intermediario (broker MQTT público)
// ve la señal de conexión, no se queda con el inventario. El reloj viaja por el
// canal directo (WebRTC). Si eso falla, no se escribe nada.
import { WATCHES } from './data/watches.js';
import { builds, forgetBuild, importDealBuild, watchFromSpec, cleanName, normalizeSpec } from './build.js';
import { inventory, dropInventory, receiveInventory } from './peritaje.js';

const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const TRUTHS = ['real', 'fake', 'modified', 'franken', 'nuevo', 'bueno', 'rayado', 'agua', 'roto'];

export function makeCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(5);
  crypto.getRandomValues(b);
  let s = '';
  for (const n of b) s += A[n % A.length];
  return s;
}

export function cleanCode(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z2-9]/g, '').replace(/[01IO]/g, '').slice(0, 5);
}

function clampPrice(n) {
  const x = Math.round(+n);
  if (!Number.isFinite(x) || x < 50 || x > 500000) return 0;
  return x;
}

export function sanitizeCard(card) {
  if (!card || (card.kind !== 'build' && card.kind !== 'peri')) return null;
  const name = cleanName(card.name);
  if (card.kind === 'build') {
    const spec = card.spec || {};
    const n = normalizeSpec(spec);
    const w = n && watchFromSpec('bcheck1', n, name);
    if (!w) return null;
    return { kind: 'build', name: w.name, spec: n };
  }
  const watch = WATCHES[card.watchId];
  if (!watch || watch.custom) return null;
  const truth = TRUTHS.includes(card.truth) ? card.truth : null;
  if (!truth) return null;
  return { kind: 'peri', name: watch.name, watchId: card.watchId, truth, claim: cleanName(card.claim || watch.name) };
}

export function localStock() {
  const out = [];
  for (const b of builds()) {
    if (!b.ready) continue;
    const card = sanitizeCard({ kind: 'build', name: b.name, spec: b.spec });
    if (card) out.push({ holdId: b.id, card });
  }
  for (const it of inventory()) {
    const card = sanitizeCard({ kind: 'peri', name: it.claim, watchId: it.watchId, truth: it.truth, claim: it.claim });
    if (card) out.push({ holdId: it.id, card });
  }
  return out;
}

export function freshDeal(role, holdId) {
  return {
    role, holdId: holdId || null, code: '', status: 'wait',
    card: null, ask: 0, price: 0, round: 0,
    sellerOk: false, buyerOk: false, sellerConfirm: false, buyerConfirm: false,
    phrase: role === 'sell' ? 'Sala abierta. Pasa el código.' : 'Entrando a la sala…',
    result: null
  };
}

// Una sola función para los dos teléfonos. El que actúa manda el evento; el otro lo aplica igual.
export function dealReduce(state, ev) {
  if (!state || !ev) return state;
  if (state.status === 'done' || state.status === 'cancel' || state.status === 'fail') return state;
  if (ev.t === 'walk') return { ...state, status: 'cancel', phrase: 'El trato se cayó. El reloj no cambia de teléfono.' };
  if (ev.t === 'fail') return { ...state, status: 'fail', phrase: ev.phrase || 'No se pudo conectar. El reloj sigue donde estaba.' };
  if (ev.t === 'card') {
    if (state.status !== 'wait') return state;
    const card = sanitizeCard(ev.card);
    const ask = clampPrice(ev.ask);
    if (!card || !ask) return { ...state, status: 'cancel', phrase: 'Ese reloj o ese precio no se puede pasar.' };
    return {
      ...state, status: 'talk', card, ask, price: ask, round: 1,
      sellerOk: true, buyerOk: false, sellerConfirm: false, buyerConfirm: false,
      phrase: 'Precio pedido ' + ask + '. El otro puede aceptar u ofrecer.'
    };
  }
  if (ev.t === 'bid') {
    if (state.status !== 'talk' && state.status !== 'seal') return state;
    if (ev.who !== 'sell' && ev.who !== 'buy') return state;
    if (state.round >= 4) return { ...state, status: 'cancel', phrase: 'Se acabaron las cuatro rondas. El reloj no se mueve.' };
    const price = clampPrice(ev.price);
    if (!price) return state;
    return {
      ...state, status: 'talk', price, round: state.round + 1,
      sellerOk: ev.who === 'sell', buyerOk: ev.who === 'buy', sellerConfirm: false, buyerConfirm: false,
      phrase: (ev.who === 'sell' ? 'El vendedor pone ' : 'Oferta de ') + price + '.'
    };
  }
  if (ev.t === 'accept') {
    if (state.status !== 'talk') return state;
    if (ev.who !== 'sell' && ev.who !== 'buy') return state;
    const sellerOk = state.sellerOk || ev.who === 'sell';
    const buyerOk = state.buyerOk || ev.who === 'buy';
    if (sellerOk && buyerOk) return { ...state, sellerOk, buyerOk, status: 'seal', phrase: 'Los dos aceptan. Falta que los dos confirmen.' };
    return { ...state, sellerOk, buyerOk, phrase: 'Uno aceptó ' + state.price + '. Falta el otro.' };
  }
  if (ev.t === 'confirm') {
    if (state.status !== 'seal') return state;
    if (ev.who !== 'sell' && ev.who !== 'buy') return state;
    const sellerConfirm = state.sellerConfirm || ev.who === 'sell';
    const buyerConfirm = state.buyerConfirm || ev.who === 'buy';
    if (sellerConfirm && buyerConfirm) return { ...state, sellerConfirm, buyerConfirm, status: 'done', phrase: 'Trato cerrado.' };
    return { ...state, sellerConfirm, buyerConfirm, phrase: 'Falta la confirmación del otro.' };
  }
  return state;
}

export function applyTransfer(state) {
  if (!state || state.status !== 'done' || !state.card) return { ok: false };
  if (state.role === 'sell') {
    if (!state.holdId) return { ok: false, side: 'sold' };
    const gone = state.card.kind === 'build' ? forgetBuild(state.holdId) : dropInventory(state.holdId);
    return { ok: !!gone, side: 'sold', holdId: state.holdId, kind: state.card.kind, gone: !!gone };
  }
  if (state.card.kind === 'build') {
    const w = importDealBuild(state.card.name, state.card.spec);
    if (!w) return { ok: false, side: 'bought' };
    return { ok: true, side: 'bought', kind: 'build', id: w.id };
  }
  const row = {
    id: 'i' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36),
    offerId: 'deal',
    watchId: state.card.watchId,
    truth: state.card.truth,
    verdict: state.card.truth,
    paid: state.price,
    worth: state.price,
    claim: state.card.claim,
    at: Date.now()
  };
  if (!receiveInventory(row)) return { ok: false, side: 'bought' };
  return { ok: true, side: 'bought', kind: 'peri', watchId: state.card.watchId };
}

function concat(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const o = new Uint8Array(n);
  let i = 0;
  for (const p of parts) { o.set(p, i); i += p.length; }
  return o;
}
function u8(arr) { return Uint8Array.from(arr); }
function encStr(s) {
  const b = new TextEncoder().encode(s);
  return concat([u8([b.length >> 8, b.length & 255]), b]);
}
function encRest(len) {
  const o = [];
  do { let b = len % 128; len = Math.floor(len / 128); if (len > 0) b |= 128; o.push(b); } while (len > 0);
  return u8(o);
}
function connectPkt(id) {
  const body = concat([encStr('MQTT'), u8([4, 2, 0, 45]), encStr(id)]);
  return concat([u8([0x10]), encRest(body.length), body]);
}
function subPkt(id, topic) {
  const body = concat([u8([id >> 8, id & 255]), encStr(topic), u8([0])]);
  return concat([u8([0x82]), encRest(body.length), body]);
}
function pubPkt(topic, text) {
  const body = concat([encStr(topic), new TextEncoder().encode(text)]);
  return concat([u8([0x30]), encRest(body.length), body]);
}
function decStr(u, i) {
  const n = (u[i] << 8) | u[i + 1];
  return [new TextDecoder().decode(u.subarray(i + 2, i + 2 + n)), i + 2 + n];
}
function decPub(u) {
  let i = 1, n = 0, m = 1, b;
  do { b = u[i++]; n += (b & 127) * m; m *= 128; } while (b & 128);
  const [topic, j] = decStr(u, i);
  return { topic, text: new TextDecoder().decode(u.subarray(j)) };
}

function mqttOpen(url, clientId) {
  return new Promise((resolve, reject) => {
    let ws;
    try { ws = new WebSocket(url, ['mqtt']); } catch (e) { reject(e); return; }
    ws.binaryType = 'arraybuffer';
    const timer = setTimeout(() => { try { ws.close(); } catch { /* cerrado */ } reject(new Error('timeout')); }, 8000);
    let onMsg = () => {};
    let subWait = null;
    const api = {
      subscribe(topic) {
        return new Promise((res, rej) => {
          subWait = res;
          try { ws.send(subPkt(1, topic)); } catch (e) { rej(e); }
          setTimeout(() => { if (subWait) { subWait = null; res(); } }, 1500);
        });
      },
      publish(topic, obj) { try { ws.send(pubPkt(topic, JSON.stringify(obj))); } catch { /* el otro ya no está */ } },
      listen(fn) { onMsg = fn; },
      close() { clearTimeout(timer); try { ws.close(); } catch { /* cerrado */ } }
    };
    ws.onopen = () => { try { ws.send(connectPkt(clientId)); } catch (e) { clearTimeout(timer); reject(e); } };
    ws.onerror = () => { clearTimeout(timer); try { ws.close(); } catch { /* cerrado */ } reject(new Error('ws')); };
    ws.onmessage = (ev) => {
      const u = new Uint8Array(ev.data);
      const type = u[0] >> 4;
      if (type === 2) {
        clearTimeout(timer);
        if (u.length > 3 && u[3] !== 0) { try { ws.close(); } catch { /* cerrado */ } reject(new Error('conn')); return; }
        resolve(api);
      }
      else if (type === 9 && subWait) { const fn = subWait; subWait = null; fn(); }
      else if (type === 3) { try { const d = decPub(u); onMsg(d.topic, d.text); } catch { /* paquete raro */ } }
    };
    ws.onclose = () => { if (subWait) subWait = null; if (api.onDrop) api.onDrop(); };
  });
}

async function mqttAny(clientId) {
  let last = null;
  for (const url of BROKERS) {
    try { return await mqttOpen(url, clientId); } catch (e) { last = e; }
  }
  throw last || new Error('ws');
}

export function openRoom({ role, code, card, ask, holdId, onState }) {
  let state = { ...freshDeal(role, holdId), code };
  let dead = false;
  let pc = null, dc = null, link = null, ping = 0, hello = 0, handshake = 0, idle = 0, dropTimer = 0;
  let remoteSet = false;
  let starting = false;
  const iceQueue = [];
  const me = 'z' + Math.random().toString(36).slice(2, 10);
  const topic = 'zarumei/d1/' + code;
  const emit = () => { if (onState) onState(state); };

  function shutdown() {
    dead = true;
    clearInterval(ping); clearInterval(hello); clearTimeout(handshake); clearTimeout(idle); clearTimeout(dropTimer);
    try { if (dc) dc.close(); } catch { /* cerrado */ }
    try { if (pc) pc.close(); } catch { /* cerrado */ }
    try { if (link) link.close(); } catch { /* cerrado */ }
  }
  function fail(phrase) {
    if (dead || state.status === 'done' || state.status === 'cancel') return;
    state = dealReduce(state, { t: 'fail', phrase });
    emit();
    shutdown();
  }
  function push(ev) {
    if (dead) return;
    // El comprador escribe primero y manda el acuse. El vendedor suelta solo entonces:
    // si el cable se corta, el reloj no desaparece.
    if (ev && ev.t === 'got') {
      if (state.role === 'sell' && state.status === 'done' && !state.result) {
        state = { ...state, phrase: 'Trato cerrado.', result: applyTransfer(state) };
        emit();
      }
      return;
    }
    if (ev && ev.t === 'walk') {
      state = dealReduce(state, ev);
      emit();
      if (state.status !== 'done') shutdown();
      return;
    }
    const prev = state.status;
    state = dealReduce(state, ev);
    if (state.status === 'done' && prev !== 'done') {
      clearTimeout(handshake); clearTimeout(idle); clearInterval(hello);
      if (state.role === 'buy') {
        const result = applyTransfer(state);
        state = { ...state, result };
        if (result.ok && dc && dc.readyState === 'open') {
          try { dc.send(JSON.stringify({ t: 'got' })); } catch { /* sin acuse el vendedor no suelta */ }
        }
      } else {
        state = { ...state, phrase: 'Trato cerrado. Esperando el acuse para soltar el reloj.' };
      }
    }
    emit();
    if (state.status === 'cancel' || state.status === 'fail') shutdown();
  }
  function send(ev) {
    const raw = JSON.stringify(ev);
    if (dc && dc.readyState === 'open') { try { dc.send(raw); } catch { /* canal caído */ } }
    push(ev);
  }
  function signal(obj) { if (link && !dead) link.publish(topic, { ...obj, from: me }); }

  function bindChannel(ch) {
    dc = ch;
    const opened = () => {
      clearTimeout(handshake); clearInterval(hello); clearTimeout(idle);
      if (role === 'sell') send({ t: 'card', card, ask });
    };
    ch.onopen = opened;
    ch.onmessage = (e) => {
      let ev; try { ev = JSON.parse(e.data); } catch { return; }
      push(ev);
    };
    ch.onclose = () => {
      if (dead || state.status === 'cancel' || state.status === 'fail') return;
      if (state.status === 'done') {
        if (state.role === 'sell' && !state.result) {
          state = { ...state, phrase: 'Se cortó antes de soltar el reloj. Sigue en este teléfono.', result: { ok: false, side: 'kept' } };
          emit();
        }
        shutdown();
        return;
      }
      fail('Se cortó la sala. El reloj sigue donde estaba.');
    };
    if (ch.readyState === 'open') opened();
  }

  async function addIce(c) {
    if (!c) return;
    if (!pc || !remoteSet) { iceQueue.push(c); return; }
    try { await pc.addIceCandidate(c); } catch { /* candidato viejo */ }
  }
  async function flushIce() {
    remoteSet = true;
    while (iceQueue.length) await addIce(iceQueue.shift());
  }
  function ensurePc() {
    if (pc) return pc;
    pc = new RTCPeerConnection(STUN);
    pc.onicecandidate = (e) => { if (e.candidate) signal({ t: 'ice', c: e.candidate }); };
    pc.onconnectionstatechange = () => {
      if (dead || !pc) return;
      const s = pc.connectionState;
      if (s === 'failed' || s === 'closed') fail('Se cortó la sala. El reloj sigue donde estaba.');
      else if (s === 'disconnected') {
        clearTimeout(dropTimer);
        dropTimer = setTimeout(() => {
          if (!dead && pc && pc.connectionState === 'disconnected') fail('Se cortó la sala. El reloj sigue donde estaba.');
        }, 4000);
      } else clearTimeout(dropTimer);
    };
    if (role === 'sell') bindChannel(pc.createDataChannel('deal'));
    else pc.ondatachannel = (e) => bindChannel(e.channel);
    return pc;
  }
  async function onHello(msg) {
    if (msg.role === role) { fail('Esa sala ya tiene a alguien en tu sitio.'); return; }
    if (pc || starting) return;
    starting = true;
    clearInterval(hello);
    handshake = setTimeout(() => fail('No se pudo conectar de teléfono a teléfono. Nada cambió.'), 20000);
    ensurePc();
    if (role === 'sell') {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal({ t: 'sdp', sdp: pc.localDescription });
    }
  }
  async function onSdp(msg) {
    ensurePc();
    await pc.setRemoteDescription(msg.sdp);
    await flushIce();
    if (msg.sdp && msg.sdp.type === 'offer' && role === 'buy') {
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      signal({ t: 'sdp', sdp: pc.localDescription });
    }
  }

  idle = setTimeout(() => fail('La sala se cerró por espera. Nada cambió.'), 180000);
  emit();
  let opened = null;
  mqttAny(me).then(async (api) => {
    opened = api;
    link = api;
    try {
      if (dead) { api.close(); return; }
      api.onDrop = () => {
        if (!dc || dc.readyState !== 'open') fail('Sin sala ahora mismo. El reloj sigue en este teléfono.');
      };
      ping = setInterval(() => { try { api.publish(topic, { t: 'ping', from: me }); } catch { /* sigue el ping */ } }, 20000);
      api.listen((_t, text) => {
        let msg; try { msg = JSON.parse(text); } catch { return; }
        if (!msg || msg.from === me || msg.t === 'ping') return;
        if (msg.t === 'full') { fail('Sala llena.'); return; }
        if (msg.t === 'hello') onHello(msg).catch(() => fail('No se pudo conectar. Nada cambió.'));
        else if (msg.t === 'sdp') onSdp(msg).catch(() => fail('No se pudo conectar. Nada cambió.'));
        else if (msg.t === 'ice') addIce(msg.c);
      });
      await api.subscribe(topic);
      if (dead) return;
      const hi = () => { if (!dead && !pc) signal({ t: 'hello', role }); };
      hi();
      hello = setInterval(hi, 2000);
    } catch {
      try { api.close(); } catch { /* ya cerrado */ }
      fail('Sin sala ahora mismo. El reloj sigue en este teléfono.');
    }
  }).catch(() => {
    try { if (opened) opened.close(); } catch { /* ya cerrado */ }
    fail('Sin sala ahora mismo. El reloj sigue en este teléfono.');
  });

  return {
    get state() { return state; },
    act(ev) { if (!dead) send({ ...ev, who: role }); },
    close() {
      if (dead) return;
      if (state.status === 'talk' || state.status === 'seal' || state.status === 'wait') send({ t: 'walk', who: role });
      else shutdown();
    }
  };
}
