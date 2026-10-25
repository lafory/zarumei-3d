// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE REGLAS (sin 3D). Lee los datos (calibre, reloj, falla, caso) y decide
// si cada acción del jugador es válida. Devuelve mensajes + efectos (fx) que main.js anima.
// ─────────────────────────────────────────────────────────────────────────────
import { CALIBERS } from './data/calibers.js';
import { WATCHES } from './data/watches.js';
import { FAULTS, TG_OK } from './data/faults.js';
import { TOOLS } from './data/tools.js';

const SUB = { watch: 'el reloj', jewel: 'el rubí del amortiguador', spring: 'el resorte del amortiguador', regulator: 'la raqueta' };
const toolName = (id) => (TOOLS.find(t => t.id === id) || { name: id }).name;
const mm = (s) => String(s).replace('.', ',') + ' mm';

export function createEngine({ watchId, faultId, story = null, empty = false }) {
  const W = WATCHES[watchId], base = CALIBERS[W.caliber], F = FAULTS[faultId];
  const quartz = base.type === 'quartz';
  const crystalPart = {
    id: 'crystal', name: 'el cristal', side: 'face', coveredBy: [], optional: true,
    tool: 'caseKnife', placeTool: 'handPress',
    removeMsg: 'Cristal fuera.',
    placeMsg: 'Cristal prensado.'
  };
  const C = { ...base, parts: [...base.parts, crystalPart] };
  const P = {}; C.parts.forEach(p => (P[p.id] = p));
  if (W.case && W.case.caseback === 'snap' && P.caseback && P.caseback.tool === 'caseWrench') {
    P.caseback = { ...P.caseback, name: 'el fondo a presión', tool: 'caseKnife', placeTool: 'caseKnife', placeMsg: 'Fondo cerrado a presión.' };
  }
  const st = {}; C.parts.forEach(p => (st[p.id] = 'in'));
  const screws = {};
  C.parts.forEach(p => (p.screws || []).forEach((s, i) => { screws[`${p.id}#${i}`] = { id: `${p.id}#${i}`, part: p.id, i, s: s.s, k: s.k, lh: !!s.lh, state: 'in', dmg: 0, prog: 0 }; }));
  const flags = { letdown: false, protector: false, flipped: false, mvLoc: 'case', holderSide: 'bridge' };
  const oiled = new Set(), removedOnce = new Set(), diagDone = new Set(), history = [], replaced = new Set();
  const stats = { errors: 0, wrongTool: 0, wrongOrder: 0, slips: 0, lost: 0, wrongScrews: 0, spares: 0, hints: 0, oilMissed: 0 };
  let fstep = 0, score = 100, armed = null, finished = false, revealed = false, freeDone = false;
  const diagList = story ? story.diag.slice() : [];
  const name = (id) => (P[id] && P[id].name) || SUB[id] || id;
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  // Build: ninguna pieza nace montada. history sigue el orden del calibre (de fuera hacia dentro)
  // para que la pista monte al revés, con las mismas reglas de coveredBy, aceite y tornillos.
  if (empty) {
    for (const p of C.parts) { st[p.id] = 'out'; history.push(p.id); removedOnce.add(p.id); }
    for (const s of Object.values(screws)) s.state = 'out';
    flags.mvLoc = 'holder';
    flags.holderSide = 'bridge';
    freeDone = true;
  }
  const faultFixed = () => fstep >= F.steps.length;
  const screwsOf = (id) => Object.values(screws).filter(s => s.part === id);
  const screwsIn = (id) => screwsOf(id).filter(s => s.state === 'in');
  const coversOf = (id) => C.parts.filter(r => r.coveredBy.includes(id)).map(r => r.id); // deben estar montadas antes que id
  const placeTool = (id) => P[id].placeTool || P[id].tool;
  const oilPending = (id) => { const o = P[id].oil; return !!o && o.when === 'after' && removedOnce.has(id) && st[id] === 'in' && !oiled.has(id); };
  const dialParts = () => C.parts.filter(p => p.side === 'dial').map(p => p.id);

  function penal(n, kind) { score = Math.max(0, score - n); stats.errors++; if (kind) stats[kind]++; }
  const R = (kind, msg, fx = []) => ({ kind, msg, fx });
  const bad = (msg, n = 5, k = 'wrongTool', fx = []) => { penal(n, k); return R('bad', '❌ ' + msg, fx); };

  // ── acceso físico (dónde está el movimiento y hacia dónde mira) ──
  function access(id) {
    const side = P[id] ? P[id].side : 'case';
    if (side === 'face') return !flags.flipped;
    if (side === 'case') return flags.mvLoc === 'case' && flags.flipped;
    if (side === 'bridge') return (flags.mvLoc === 'case' && flags.flipped && st.caseback === 'out') || (flags.mvLoc === 'holder' && flags.holderSide === 'bridge');
    if (side === 'dial') return flags.mvLoc === 'holder' && flags.holderSide === 'dial';
    return true;
  }
  function accessMsg(id) {
    const side = P[id].side;
    if (side === 'face') return 'Voltea el reloj boca arriba: el cristal se saca y se prensa por la esfera.';
    if (side === 'dial') return flags.mvLoc === 'case' ? 'Al lado esfera solo se llega con el movimiento <b>fuera de la caja</b>, en el soporte y volteado.' : 'Voltea el movimiento en el soporte (↻) para trabajar en el <b>lado esfera</b>.';
    if (flags.mvLoc === 'holder') return side === 'case' ? 'Eso es de la caja: el movimiento está en el soporte.' : 'Voltea el movimiento en el soporte (↻) para ver el <b>lado puentes</b>.';
    if (!flags.flipped) return 'Voltea el reloj (↻) para trabajar por el fondo.';
    return `Primero abre ${name('caseback')}.`;
  }
  const running = () => {
    if (F.id === 'humedad') return false;
    if (quartz) {
      const need = ['battery', 'circuit', 'coil', 'trainBridge', 'stepRotor', 'secondWheel', 'thirdWheel', 'fifthWheel', 'centerWheel'];
      if (!need.every(i => st[i] === 'in')) return false;
      if ((F.id === 'bateria' || F.id === 'bobina') && !faultFixed()) return false;
      return true;
    }
    if (flags.letdown) return false;
    const need = ['balance', 'palletFork', 'palletBridge', 'escapeWheel', 'trainBridge', 'barrel', 'barrelBridge', 'ratchet', 'click', 'secondWheel', 'thirdWheel', 'interWheel'];
    if (!need.every(i => st[i] === 'in')) return false;
    if (F.id === 'ejeRoto' && !faultFixed()) return false;
    return true;
  };
  function tgRead() {
    if (!running()) {
      if (F.id === 'humedad') return { none: true, note: 'Silencio total. No es falta de cuerda: hay <b>agua dentro</b>.' };
      return { none: true, note: quartz ? 'Sin impulsos del motor: <b>no funciona</b>.' : (flags.letdown ? 'Sin cuerda: el muelle real está descargado.' : 'Sin tic-tac: el reloj está <b>parado</b>.') };
    }
    if (!faultFixed() && F.tg && F.tg.before) return F.tg.before;
    return quartz ? TG_OK.quartz : (F.free ? F.tg.before : TG_OK.auto);
  }
  const amplitude = () => { const r = tgRead(); return r.none ? 0 : (r.amp || 280); };
  function allIn() { return C.parts.every(p => st[p.id] === 'in') && Object.values(screws).every(s => s.state === 'in'); }
  function missingList() {
    const m = [];
    const outP = C.parts.filter(p => st[p.id] === 'out'); if (outP.length) m.push(`${outP.length} pieza(s) sin montar`);
    const sOut = Object.values(screws).filter(s => s.state !== 'in'); if (sOut.length) m.push(`${sOut.length} tornillo(s) sin poner`);
    const oil = C.parts.filter(p => oilPending(p.id)); if (oil.length) m.push(`lubricar ${oil.map(p => name(p.id)).join(', ')}`);
    if (!faultFixed()) m.push('la falla sin reparar');
    if (!quartz && flags.letdown && allIn()) m.push('dar cuerda');
    return m;
  }
  const diagPending = () => diagList.find(t => !diagDone.has(t));

  // ── diagnóstico ──
  function meterRead(target) {
    if (!quartz) return R('info', '🔌 Es un reloj <b>mecánico</b>: el multímetro no aplica.');
    if (target === 'battery') { const v = (F.meter && F.meter.battery && !replaced.has('battery')) ? F.meter.battery : '1,55 V (bien)'; return R('info', `🔋 Pila: <b>${v}</b>`); }
    if (target === 'coil') { const v = (F.meter && F.meter.coil && !replaced.has('coil')) ? F.meter.coil : '1,9 kΩ (bien)'; return R('info', `🧵 Bobina: <b>${v}</b>`); }
    return R('info', 'Toca la <b>pila</b> o la <b>bobina</b> con las puntas del multímetro (abre el fondo).');
  }
  function diagTool(tool, target) {
    if (tool === 'timegrapher') { diagDone.add('timegrapher'); const r = tgRead(); const fx = [{ fx: 'tg', reading: r }]; const fin = checkFinish(); if (fin) fx.push(fin); return R('info', r.none ? '📉 ' + r.note : `📈 ${r.quartz ? 'Cuarzo: un impulso por segundo, marcha ' + (r.rate >= 0 ? '+' : '') + (r.rate ?? 0) + ' s/día. Funciona.' : (r.rate > 0 ? '+' : '') + r.rate + ' s/día · ' + r.amp + '°'}`, fx); }
    if (tool === 'compass') { diagDone.add('compass'); const mag = F.compass && !faultFixed(); return R('info', mag ? '🧭 ¡La aguja <b>gira</b> al acercarla! El reloj está <b>magnetizado</b>.' : '🧭 La aguja no se mueve: <b>no está magnetizado</b>. (El magnetismo suele <b>adelantar</b> el reloj).', [{ fx: 'compass', mag }]); }
    return null;
  }

  // ── falla ──
  const curStep = () => F.steps[fstep];
  function stepReady(s) {
    if (s.on === 'watch') return true;
    if (s.need === 'out') return st[s.part] === 'out';
    return st[s.part] === 'in' && access(s.part);
  }
  function doStep(s) {
    fstep++; if (s.fx === 'reveal') revealed = true;
    const fx = s.fx ? [{ fx: 'fault', effect: s.fx, on: s.on, part: s.part }] : [];
    if (faultFixed()) fx.push({ fx: 'fixed' });
    return R('good', s.msg, fx);
  }

  // ── quitar / montar ──
  function canRemove(id) {
    const p = P[id];
    if (story && diagPending()) return { err: `Antes de abrir, un relojero <b>diagnostica</b>: usa ${toolName(diagPending())} sobre el reloj.`, k: 'wrongOrder' };
    if (!access(id)) return { info: accessMsg(id) };
    const cov = p.coveredBy.find(c => st[c] === 'in');
    if (cov) return { err: `Orden incorrecto: ${name(id)} está tapado por ${name(cov)}.`, k: 'wrongOrder' };
    if ((p.requires || []).includes('letdown') && !flags.letdown) return { err: 'Antes se <b>descarga el muelle real</b> (libera el cliquet con pinzas). Con la fuerza puesta, el escape se puede romper.', k: 'wrongOrder' };
    if ((p.requires || []).includes('protector') && !flags.protector) return { err: 'Pon antes el <b>protector de esfera</b>: las palancas rayarían la esfera.', k: 'wrongOrder' };
    if (id === 'dial' && flags.protector) return { err: 'Las agujas ya están fuera: retira el <b>protector de esfera</b> (herramienta Protector sobre la esfera) y luego levanta la esfera.', k: 'wrongOrder' };
    const n = screwsIn(id).length; if (n) return { err: `${cap(name(id))} aún tiene ${n} tornillo${n > 1 ? 's' : ''}: desatorníllalo${n > 1 ? 's' : ''} primero, uno a uno.`, k: 'wrongOrder' };
    return { ok: true };
  }
  function canInstall(id) {
    const p = P[id];
    if (id === 'movement') { if (!flags.flipped) return { info: 'Voltea la caja (↻) para volver a meter el movimiento por el fondo.' }; }
    else if (p.side === 'face') { if (flags.flipped) return { info: 'Voltea el reloj boca arriba para prensar el cristal.' }; }
    else if (p.side === 'case') { if (flags.mvLoc !== 'case') return { err: `Primero vuelve a meter el movimiento en la caja.`, k: 'wrongOrder' }; if (!flags.flipped) return { info: 'Voltea el reloj (↻) para trabajar por el fondo.' }; }
    else if (!access(id)) return { info: accessMsg(id) };
    for (const r of coversOf(id)) {
      if (st[r] !== 'in') return { err: `Orden de montaje: antes va ${name(r)}.`, k: 'wrongOrder' };
      if (screwsIn(r).length < screwsOf(r).length) return { err: `Antes atornilla ${name(r)} (faltan ${screwsOf(r).length - screwsIn(r).length} tornillos).`, k: 'wrongOrder' };
      if (oilPending(r)) { stats.oilMissed++; return { err: `Falta lubricar ${name(r)} antes de taparlo (${P[r].oil.lube}).`, k: 'wrongOrder' }; }
    }
    if (p.placeNeedsDial) {
      const miss = dialParts().find(d => st[d] !== 'in' || screwsIn(d).length < screwsOf(d).length);
      if (miss) return { err: `El movimiento se encaja con la esfera y las agujas puestas: falta ${name(miss)}.`, k: 'wrongOrder' };
      if (flags.protector) return { err: 'Quita el <b>protector de esfera</b> antes de encajar el movimiento.', k: 'wrongOrder' };
    }
    if ((p.placeRequires || []).includes('protector') && !flags.protector) return { err: 'Pon el <b>protector de esfera</b> antes de clavar las agujas.', k: 'wrongOrder' };
    if (id === 'dial' && flags.protector) return { err: 'Primero coloca la esfera y luego el protector encima: retíralo ahora.', k: 'wrongOrder' };
    if (p.oil && p.oil.when === 'before' && !oiled.has(id)) { stats.oilMissed++; return { err: `Antes: ${p.oil.msg} (aceitera sobre la pieza en la bandeja).`, k: 'wrongOrder' }; }
    const s = curStep();
    if (s && s.replace === id && !replaced.has(id)) return { info: `Esa sigue siendo la pieza <b>vieja</b>. En <b>Piezas</b>, pon la nueva y después móntala.` };
    if (s && s.part === id && s.need === 'out') return { info: `Antes de volver a montar ${name(id)}: <b>${s.title}</b>.` };
    return { ok: true };
  }
  function removeFx(id) {
    st[id] = 'out'; removedOnce.add(id); history.push(id); oiled.delete(id);
    const fx = [{ fx: 'remove', part: id, inspect: !!(P[id].inspect || (curStep() && curStep().part === id && curStep().need === 'out')) }];
    if (id === 'movement') { flags.mvLoc = 'holder'; flags.holderSide = 'bridge'; }
    let msg = P[id].removeMsg ? '✅ ' + P[id].removeMsg : `✅ Fuera: ${name(id)}.`;
    const s = curStep();
    if (s && s.removed === id) { const r2 = doStep(s); replaced.add(id); msg = r2.msg; fx.push(...r2.fx); }
    return R('good', msg, fx);
  }
  function installFx(id) {
    st[id] = 'in'; const i = history.lastIndexOf(id); if (i >= 0) history.splice(i, 1);
    if (id === 'movement') { flags.mvLoc = 'case'; }
    const fx = [{ fx: 'install', part: id }];
    let msg = `🔧 Montado: ${name(id)}` + (replaced.has(id) ? ' (<b>nueva</b>)' : '') + '.';
    if (P[id].placeMsg) msg += ' ' + P[id].placeMsg;
    if (screwsOf(id).length) msg += screwsOf(id).length > 1 ? ` Ahora sus ${screwsOf(id).length} tornillos.` : ' Ahora su tornillo.';
    else if (oilPending(id)) msg += ` Lubrica: ${P[id].oil.msg}`;
    if (id === 'caseback' && !quartz && flags.letdown) msg += ' Recuerda dar cuerda.';
    return R('good', msg, fx);
  }

  // ── toque sobre una pieza (en el reloj o en la bandeja) ──
  function tapPart(id, tool, size) {
    if (finished) return R('info', 'Trabajo terminado.');
    if (!tool) return R('info', `Primero elige una <b>herramienta</b>. Tocaste ${name(id)}.`);
    const d = diagTool(tool, id); if (d) return d;
    if (tool === 'meter') { const s = curStep(); if (s && s.tool === 'meter' && s.on === id && stepReady(s)) { const m = meterRead(id); const r = doStep(s); return R('good', m.msg + '<br>' + r.msg, r.fx); } if (id !== 'battery' && id !== 'coil') return meterRead(id); if (!access(id) && st[id] === 'in') return R('info', accessMsg(id)); return meterRead(id); }
    if (tool === 'blower') return R('info', '💨 Soplaste el polvo. Limpio, pero eso no repara nada.');
    if (tool === 'dialProtector') {
      if (flags.mvLoc === 'holder' && flags.holderSide === 'dial' && (P[id] ? P[id].side === 'dial' : id === 'movement')) { flags.protector = !flags.protector; return R('good', flags.protector ? '🛡 Protector de esfera puesto.' : '🛡 Protector de esfera retirado.', [{ fx: 'protector', on: flags.protector }]); }
      return R('info', 'El protector se pone sobre la esfera con el movimiento en el soporte, <b>lado esfera</b>.');
    }
    // paso de reparación
    const s = curStep();
    if (s && !s.removed && s.on === id) {
      const toolOk = s.tool === tool;
      if (toolOk && stepReady(s)) return doStep(s);
      if (toolOk) return R('info', s.need === 'out' ? `Para eso, ${name(s.part)} tiene que estar <b>fuera</b>, sobre la alfombrilla.` : accessMsg(s.part));
      if (tool === 'loupe') return R('info', '🔍 Lo ves de cerca.', [{ fx: 'zoom', part: s.part }]);
      if (st[s.part] === 'out' || s.on === 'watch') return bad(`${toolName(tool)} no es lo que toca aquí. Paso: <b>${s.title}</b>.`);
    }
    if (tool === 'demag') return R('info', '🧲 Desmagnetizado por precaución. No cambia nada: <b>no era magnetismo</b>.');
    if (tool === 'loupe') return R('info', `🔍 ${cap(name(id))}: se ve bien, sin daños visibles.`, [{ fx: 'zoom', part: P[id] ? id : null }]);
    if (id === 'watch' || !P[id]) return id === 'watch' ? R('info', 'Toca una pieza concreta (voltea el reloj para trabajar por el fondo).') : R('info', `Eso es ${name(id)}.`);
    const p = P[id];
    if (st[id] === 'out') return tapChip(id, tool, size);
    // acción especial (descargar muelle real)
    if (p.action && tool === p.action.tool && !flags[p.action.flag]) {
      if (!access(id)) return R('info', accessMsg(id));
      const nb = p.action.needOut.find(n => st[n] === 'in'); if (nb) return bad(`Orden incorrecto: ${name(id)} está tapado por ${name(nb)}.`, 5, 'wrongOrder');
      flags[p.action.flag] = true; return R('good', p.action.msg, [{ fx: 'letdown' }]);
    }
    // lubricar tras montar
    if (tool === 'oiler') {
      if (oilPending(id)) { if (screwsIn(id).length < screwsOf(id).length) return R('info', 'Primero pon todos sus tornillos.'); oiled.add(id); return R('good', `🛢 ${p.oil.msg}`, [{ fx: 'oil', part: id }]); }
      return R('info', '🛢 Ahí no hace falta aceite ahora (o ya está lubricado).');
    }
    if (tool === 'screwdriver') {
      // Primero el que ya saltó a la bandeja; si no, el que solo salió a medias y sigue colgando.
      const loose = screwsOf(id).find(x => x.state !== 'in') || screwsOf(id).find(x => x.state === 'in' && x.prog > 0);
      if (loose) { if (armed && armed !== id) armed = null; return screwTurn(loose.id, tool, size, 1, 1); }
      if (screwsIn(id).length) return R('info', `Toca <b>cada tornillo</b> de ${name(id)} con la punta correcta (mantén pulsado o toca varias veces).`);
    }
    const c = canRemove(id);
    if (c.info) return R('info', c.info);
    if (c.err) return bad(c.err, 5, c.k);
    if (tool !== p.tool) {
      if (tool === 'screwdriver' && !screwsOf(id).length) return bad(`${cap(name(id))} no lleva tornillo: se levanta con ${toolName(p.tool).toLowerCase()}.`);
      return bad(`Así no: ${name(id)} se saca con <b>${toolName(p.tool).toLowerCase()}</b>.`);
    }
    return removeFx(id);
  }
  // ── toque sobre una pieza que está en la bandeja (o su chip) ──
  function tapChip(id, tool, size) {
    if (!P[id]) return R('info', '');
    // La ficha 🔩 tiene que funcionar con la pieza todavía montada: antes se ignoraba y el tornillo no volvía.
    if (tool === 'screwdriver') {
      const loose = screwsOf(id).find(x => x.state !== 'in') || screwsOf(id).find(x => x.state === 'in' && x.prog > 0);
      armed = loose ? id : null;
      if (st[id] === 'in') {
        if (!loose) return R('info', `${cap(name(id))} no tiene tornillos sueltos.`);
        if (!access(id)) return R('info', accessMsg(id));
        return screwTurn(loose.id, tool, size, 1, 1);
      }
      return R('info', armed ? `🔩 Tornillos de ${name(id)} listos. Coloca la pieza y aprieta con punta de <b>${mm(loose.s)}</b>, o toca el agujero.` : `${cap(name(id))} no tiene tornillos sueltos.`);
    }
    if (st[id] !== 'out') return R('info', '');
    if (!tool) return R('info', `Elige la herramienta para colocar ${name(id)}.`);
    const s = curStep();
    if (s && !s.removed && s.part === id && (s.on === id || SUB[s.on])) {
      if (tool === s.tool && stepReady(s)) return doStep(s);
    }
    if (tool === 'loupe') return R('info', `🔍 ${cap(name(id))}.`, [{ fx: 'zoom', part: id }]);
    if (tool === 'oiler' && P[id].oil && P[id].oil.when === 'before') { oiled.add(id); return R('good', '🛢 ' + P[id].oil.msg, [{ fx: 'oil', part: id }]); }
    if (['timegrapher', 'compass', 'meter', 'blower', 'demag'].includes(tool)) return tapPart(id === 'battery' || id === 'coil' ? id : 'watch', tool, size);
    const c = canInstall(id);
    if (c.info) return R('info', c.info);
    if (c.err) return bad(c.err, 5, c.k);
    if (tool !== placeTool(id)) return bad(`Para colocar ${name(id)} se usa <b>${toolName(placeTool(id)).toLowerCase()}</b>.`);
    return installFx(id);
  }
  // Misma puerta que tapChip, pero sin montar: el jugador tiene que acertar el sitio.
  function placeCheck(id, tool) {
    if (!P[id] || st[id] !== 'out') return { seek: false };
    if (!tool) return R('info', `Elige la herramienta para colocar ${name(id)}.`);
    const s = curStep();
    if (s && !s.removed && s.part === id && (s.on === id || SUB[s.on])) {
      if (tool === s.tool && stepReady(s)) return { seek: false };
    }
    if (tool === 'loupe' || tool === 'screwdriver' || tool === 'dialProtector') return { seek: false };
    if (tool === 'oiler' && P[id].oil && P[id].oil.when === 'before') return { seek: false };
    if (['timegrapher', 'compass', 'meter', 'blower', 'demag'].includes(tool)) return { seek: false };
    const c = canInstall(id);
    if (c.info) return R('info', c.info);
    if (c.err) return bad(c.err, 5, c.k);
    if (tool !== placeTool(id)) return bad(`Para colocar ${name(id)} se usa <b>${toolName(placeTool(id)).toLowerCase()}</b>.`);
    return { seek: true };
  }
  function missSeat(id) {
    penal(2, 'wrongOrder');
    return R('bad', `Ahí no va. El anillo dorado marca el sitio de <b>${name(id)}</b>.`);
  }
  // ── tornillos: contacto + giro ──
  // dir: +1 apretar, −1 aflojar. Sin dir, un tornillo puesto se afloja y uno fuera se aprieta.
  function screwTurn(sid, tool, size, amount, dir) {
    const sc = screws[sid]; if (!sc) return R('info', '');
    const p = P[sc.part];
    if (tool !== 'screwdriver') { if (tool === 'tweezers') return bad(`Ese tornillo de ${name(sc.part)} pide el <b>destornillador de ${mm(sc.s)}</b>${sc.lh ? ' (rosca a izquierdas)' : ''}. Con pinzas no sale: cuando el tornillo esté fuera, las pinzas levantan la pieza.`); return R('info', 'Elige el <b>destornillador</b> y su tamaño de punta.'); }
    if (!p || st[sc.part] !== 'in') return R('info', `${cap(name(sc.part))} no está montado. Colócalo y después atornilla.`);
    if (!access(sc.part)) return R('info', accessMsg(sc.part));
    let tightening = dir === 1 || (dir !== -1 && sc.state !== 'in');
    if (dir === 1 && sc.state === 'in' && sc.prog > 0) tightening = true;
    if (dir !== 1 && sc.state === 'in') tightening = false;
    if (!tightening && sc.state !== 'in') return R('info', 'Ese tornillo ya está fuera. Tócalo para volver a meterlo.');
    if (!tightening && sc.state === 'in' && sc.prog === 0 && story && diagPending()) return bad(`Antes de abrir, un relojero <b>diagnostica</b>: usa ${toolName(diagPending())}.`, 5, 'wrongOrder');
    const cov = (p.coveredBy || []).find(c => st[c] === 'in');
    if (cov && (sc.prog === 0 || sc.state !== 'in')) return bad(`Ese tornillo está debajo de ${name(cov)}. Quítala primero; la pista marca el que sí sale.`, 5, 'wrongOrder');
    if (sc.prog === 0) {
      if (size > sc.s + 0.05) return bad(`Punta de ${mm(size)} demasiado <b>grande</b>: no entra en la ranura y rayaría el puente. Este tornillo pide ${mm(sc.s)}.`, 2, 'wrongTool', [{ fx: 'needSize', size: sc.s }]);
      if (size < sc.s - 0.05) {
        sc.dmg++;
        if (sc.dmg >= 2 && !tightening) {
          sc.state = 'out'; sc.prog = 0; sc.spare = true; penal(3, 'slips'); penal(10, 'lost');
          return R('bad', `❌ 💥 La punta pequeña resbaló otra vez y el tornillo <b>saltó a la bandeja</b>. No se pierde: vuelve a ponerlo con la punta de ${mm(sc.s)}. El agujero sigue marcado.`, [{ fx: 'unscrew', screw: sid }, { fx: 'slip', screw: sid }, { fx: 'needSize', size: sc.s }]);
        }
        return bad(`⚠️ Punta de ${mm(size)} demasiado <b>pequeña</b>: resbala y marca la cabeza del tornillo (dañado ${Math.min(sc.dmg, 2)}/2). Usa ${mm(sc.s)}.`, 3, 'slips', [{ fx: 'slip', screw: sid }, { fx: 'needSize', size: sc.s }]);
      }
      if (tightening) {
        if (armed && armed !== sc.part) {
          const kinds = screwsOf(armed).map(x => x.k);
          if (!kinds.includes(sc.k)) { penal(5, 'wrongScrews'); const was = armed; armed = null; return R('bad', `❌ <b>Tornillo equivocado</b>: los de ${name(was)} son de otro largo o rosca. Usa los de ${name(sc.part)}.`, []); }
        }
        if (sc.state === 'lost') { stats.spares++; score = Math.max(0, score - 5); sc.spare = true; sc.state = 'out'; }
      }
    }
    // Apretar un tornillo que solo salió a medias: sigue en la pieza y puede volver a su sitio.
    if (tightening && sc.state === 'in') {
      sc.prog = Math.max(0, sc.prog - (amount || 0));
      if (sc.prog > 0) return R('turn', '🔩 Apretando…', [{ fx: 'turn', screw: sid, dir: 1, prog: sc.prog, lift: sc.prog }]);
      sc.dmg = 0;
      return R('good', '🔩 Tornillo apretado.', [{ fx: 'screw', screw: sid }]);
    }
    sc.prog = Math.min(1, sc.prog + (amount || 0));
    const lift = tightening ? (1 - sc.prog) : sc.prog;
    if (sc.prog < 1) return R('turn', tightening ? (sc.spare && sc.prog <= amount ? '🔩 Tornillo de <b>repuesto</b> (cajón LA FORY).' : '🔩 Atornillando…') : (sc.lh ? '↻ ¡Rosca a <b>izquierdas</b>! Se afloja girando a la derecha…' : '↺ Desatornillando…'), [{ fx: 'turn', screw: sid, dir: tightening ? 1 : -1, prog: sc.prog, lift }]);
    sc.prog = 0;
    if (!tightening) { sc.state = 'out'; const left = screwsIn(sc.part).length; return R('good', `🔩 Tornillo fuera → bandeja.${left ? ` Quedan ${left}.` : ` ${cap(name(sc.part))} ya se puede levantar.`}`, [{ fx: 'unscrew', screw: sid }]); }
    sc.state = 'in'; sc.dmg = 0; const left = screwsOf(sc.part).length - screwsIn(sc.part).length; if (!left) armed = null;
    let msg = `🔩 Tornillo puesto.${left ? ` Faltan ${left}.` : ` ${cap(name(sc.part))} atornillado.`}`;
    if (!left && oilPending(sc.part)) msg += ` Lubrica: ${P[sc.part].oil.msg}`;
    const fx = [];
    if ((amount || 0) >= 0.99) fx.push({ fx: 'turn', screw: sid, dir: 1, prog: 1, lift: 0 });
    fx.push({ fx: 'screw', screw: sid });
    return R('good', msg, fx);
  }
  // El primer paso futuro que habla de esta pieza: si aún es un diagnóstico, no se puede cambiar.
  function blockSwap(id) {
    for (let i = fstep; i < F.steps.length; i++) {
      const s = F.steps[i];
      const about = s.part === id || s.on === id || s.removed === id || s.replace === id;
      if (!about) continue;
      if (s.replace === id || s.removed === id || s.fx === 'replace') return null;
      return s;
    }
    return null;
  }
  function swapPart(id) {
    if (!P[id]) return R('info', '');
    if (id === 'movement') return R('info', 'El movimiento completo no se cambia: se reparan sus piezas.');
    const s = curStep();
    if (replaced.has(id)) {
      if (s && s.replace === id) { const r2 = doStep(s); return R('good', r2.msg, r2.fx); }
      if (s && s.fx === 'replace' && (s.part === id || s.on === id) && st[id] === 'out') { const r2 = doStep(s); return R('good', r2.msg, r2.fx); }
      return R('info', `${cap(name(id))} ya es la pieza <b>nueva</b>.`);
    }
    if (st[id] !== 'out') return R('info', `Saca primero ${name(id)} con ${toolName(P[id].tool).toLowerCase()}. La nueva espera en el cajón: no se cambia puesta.`);
    const block = blockSwap(id);
    if (block) return R('info', `Antes de cambiarla: <b>${block.title}</b>.`);
    const repairs = !!(s && (s.replace === id || s.removed === id || (s.fx === 'replace' && (s.part === id || s.on === id) && stepReady(s))));
    if (!repairs && !F.free) penal(2, 'spares');
    replaced.add(id);
    const fx = [{ fx: 'newpart', part: id }];
    if (s && (s.replace === id || (s.fx === 'replace' && (s.part === id || s.on === id) && stepReady(s)))) {
      const r2 = doStep(s);
      return R('good', r2.msg, fx.concat(r2.fx));
    }
    const fresh = F.free ? ' El reloj estaba sano: esta es de práctica.' : (repairs ? '' : ' Este reloj no la necesitaba.');
    return R('good', `✅ ${cap(name(id))} de <b>repuesto</b> en la bandeja. Monta la nueva.${fresh}`, fx);
  }
  function button(action) {
    if (action === 'flipWatch') { if (flags.mvLoc !== 'case' && false) return R('info', ''); flags.flipped = !flags.flipped; return R('info', flags.flipped ? 'Reloj boca abajo: trabajas por el fondo.' : 'Reloj boca arriba.', [{ fx: 'flipWatch', to: flags.flipped }]); }
    if (action === 'flipHolder') { if (flags.mvLoc !== 'holder') return R('info', 'El movimiento está en la caja.'); const pfx = []; if (flags.protector && flags.holderSide === 'dial') { flags.protector = false; pfx.push({ fx: 'protector', on: false }); } flags.holderSide = flags.holderSide === 'bridge' ? 'dial' : 'bridge'; return R('info', flags.holderSide === 'dial' ? 'Movimiento volteado: <b>lado esfera</b> arriba.' : 'Movimiento volteado: <b>lado puentes</b> arriba.', [...pfx, { fx: 'flipHolder', to: flags.holderSide }]); }
    if (action === 'wind') {
      if (quartz) return R('info', 'Es de cuarzo: no lleva cuerda.');
      if (!flags.letdown) return R('info', 'Ya tiene cuerda.');
      flags.letdown = false; const run = running();
      return R(run ? 'good' : 'info', run ? '⚙️ Cuerda dada con la corona: el volante <b>late</b>.' : '⚙️ Diste cuerda, pero el reloj no late: falta algo del rodaje o del escape.', [{ fx: 'wind' }]);
    }
    return R('info', '');
  }
  function checkFinish() {
    if (finished) return null;
    if (!allIn() || C.parts.some(p => oilPending(p.id)) || !faultFixed() || !running()) return null;
    if (!F.free && !removedOnce.size && F.steps.some(s => s.need === 'out')) return null;
    if (F.free && !removedOnce.size) return null;
    if (diagPending()) return null;
    finished = true; return { fx: 'finish' };
  }

  // ── PISTA / planificador: siguiente acción correcta ──
  function planLocation(id, mode) {
    const side = P[id].side;
    if (side === 'face') return flags.flipped ? { button: 'flipWatch' } : null;
    if (side === 'case') {
      if (id === 'movement' && mode === 'install') return flags.flipped ? null : { button: 'flipWatch' };
      if (flags.mvLoc !== 'case') return mode === 'install' ? planInstall('movement') : null;
      return flags.flipped ? null : { button: 'flipWatch' };
    }
    if (side === 'bridge') {
      if (flags.mvLoc === 'case') { if (!flags.flipped) return { button: 'flipWatch' }; if (st.caseback === 'in') return mode === 'remove' ? planRemove('caseback') : null; return null; }
      return flags.holderSide === 'bridge' ? null : { button: 'flipHolder' };
    }
    if (side === 'dial') {
      if (flags.mvLoc === 'case') return mode === 'remove' ? planRemove('movement') : null;
      return flags.holderSide === 'dial' ? null : { button: 'flipHolder' };
    }
    return null;
  }
  function planLetdown() {
    const click = C.parts.find(p => p.action && p.action.flag === 'letdown');
    for (const n of click.action.needOut) if (st[n] === 'in') return planRemove(n);
    return planLocation(click.id, 'remove') || { tool: 'tweezers', target: { part: click.id } };
  }
  function planRemove(id) {
    if (st[id] === 'out') return null;
    const p = P[id];
    for (const c of p.coveredBy) if (st[c] === 'in') return planRemove(c);
    const loc = planLocation(id, 'remove'); if (loc) return loc;
    if ((p.requires || []).includes('letdown') && !flags.letdown) return planLetdown();
    if ((p.requires || []).includes('protector') && !flags.protector) return { tool: 'dialProtector', target: { part: 'dial' } };
    if (id === 'dial' && flags.protector) return { tool: 'dialProtector', target: { part: 'dial' } };
    const sc = screwsIn(id)[0]; if (sc) return { tool: 'screwdriver', size: sc.s, target: { screw: sc.id } };
    return { tool: p.tool, size: p.anySize ? 0.8 : undefined, target: { part: id } };
  }
  function planAccess(id) { return planLocation(id, 'remove'); }
  function planInstall(id) {
    const p = P[id];
    if (p.oil && p.oil.when === 'before' && !oiled.has(id)) return { tool: 'oiler', target: { chip: id } };
    const loc = planLocation(id, 'install'); if (loc) return loc;
    if (p.placeNeedsDial && flags.protector) return { tool: 'dialProtector', target: { part: 'dial' } };
    if ((p.placeRequires || []).includes('protector') && !flags.protector) return { tool: 'dialProtector', target: { part: 'dial' } };
    if (id === 'dial' && flags.protector) return { tool: 'dialProtector', target: { part: 'dial' } };
    return { tool: placeTool(id), target: { chip: id } };
  }
  function planAssembly() {
    for (const p of C.parts) if (st[p.id] === 'in' && !p.coveredBy.some(c => st[c] === 'in')) {
      const sc = screwsOf(p.id).find(s => s.state !== 'in');
      if (sc) { const loc = planLocation(p.id, 'install'); return loc || { tool: 'screwdriver', size: sc.s, target: { screw: sc.id } }; }
      if (oilPending(p.id)) { const loc = planLocation(p.id, 'install'); return loc || { tool: 'oiler', target: { part: p.id } }; }
    }
    const outs = history.slice().reverse();
    const ready = outs.filter(id => { const save = { ...flags }; const r = coversOf(id).every(c => st[c] === 'in') && (!P[id].placeNeedsDial || dialParts().every(d => st[d] === 'in')); Object.assign(flags, save); return r; });
    const here = ready.find(id => !planLocation(id, 'install')) || ready[0];
    if (here) return planInstall(here);
    if (!quartz && flags.letdown && C.parts.filter(p => p.side !== 'case').every(p => st[p.id] === 'in')) return { button: 'wind' };
    return null;
  }
  function suggest() {
    if (finished) return null;
    const dp = diagPending(); if (dp) return { tool: dp, target: { part: 'watch' } };
    const s = curStep();
    if (s) {
      if (s.replace) { if (st[s.replace] !== 'out') return planRemove(s.replace); return { replace: s.replace }; }
      if (s.removed) return planRemove(s.removed);
      if (stepReady(s)) return { tool: s.tool, size: s.anySize ? 0.8 : undefined, target: st[s.part] === 'out' && s.on !== 'watch' ? (SUB[s.on] ? { sub: s.on, part: s.part } : { chip: s.part }) : (SUB[s.on] && s.on !== 'watch' ? { sub: s.on, part: s.part } : { part: s.on }) };
      return s.need === 'out' ? planRemove(s.part) : planAccess(s.part);
    }
    if (F.free && C.parts.some(p => st[p.id] === 'in' && !p.optional) && !freeDone) { const nxt = C.parts.find(p => st[p.id] === 'in' && !p.optional); if (nxt) { const a = planRemove(nxt.id); if (a) return a; } }
    if (F.free) freeDone = true;
    const a = planAssembly(); if (a) return a;
    if (allIn()) { if (!quartz && flags.letdown) return { button: 'wind' }; return { tool: 'timegrapher', target: { part: 'watch' } }; }
    return null;
  }
  function describe(a) {
    if (!a) return 'Nada pendiente.';
    if (a.replace) return `Abre <b>Piezas</b> y cambia ${name(a.replace)} por una <b>nueva</b>.`;
    if (a.button) return { flipWatch: 'Voltea el reloj (↻).', flipHolder: 'Voltea el movimiento en el soporte (↻).', wind: 'Da cuerda (botón «Dar cuerda»).' }[a.button];
    const t = toolName(a.tool) + (a.size ? ` de ${mm(a.size)}` : '');
    if (a.target.screw) return `Usa <b>${t}</b> en el tornillo de ${name(screws[a.target.screw].part)}.`;
    if (a.target.chip) return `Con <b>${t}</b>, toca ${name(a.target.chip)} en la bandeja.`;
    return `Usa <b>${t}</b> sobre ${name(a.target.sub || a.target.part)}.`;
  }
  function hint() { stats.hints++; score = Math.max(0, score - 2); const a = suggest(); return { action: a, msg: '💡 ' + describe(a) }; }
  function goal() {
    const dp = diagPending(); if (dp) return { phase: 'Diagnóstico', text: `Diagnostica: ${toolName(dp)}` };
    if (F.free && C.parts.some(p => !p.optional && st[p.id] === 'in' && !removedOnce.has(p.id))) return { phase: 'Desarme', text: removedOnce.size ? 'Sigue quitando. Un tornillo que no gira está debajo de otra pieza.' : 'Desarma libremente: voltea el reloj (↻) y empieza por el fondo.' };
    const s = curStep(); if (s) return { phase: 'Reparación', text: revealed || fstep > 0 ? s.title : (F.free ? 'Desarma' : 'Encuentra la falla') };
    if (!allIn()) { const total = C.parts.length + Object.keys(screws).length; const done = C.parts.filter(p => st[p.id] === 'in').length + Object.values(screws).filter(x => x.state === 'in').length; return { phase: 'Montaje', text: `Monta: ${done}/${total} piezas y tornillos` }; }
    if (!quartz && flags.letdown) return { phase: 'Montaje', text: 'Da cuerda' };
    return { phase: 'Prueba', text: 'Prueba final en el timegrapher' };
  }
  function progress() {
    const total = C.parts.length + Object.keys(screws).length;
    const inN = C.parts.filter(p => st[p.id] === 'in').length + Object.values(screws).filter(x => x.state === 'in').length;
    if (empty) return Math.min(1, (inN / total) * 0.9 + (finished ? 0.1 : 0));
    const fs = F.steps.length ? fstep / F.steps.length : 1;
    const dis = removedOnce.size ? 1 : 0;
    return Math.min(1, 0.15 * (diagList.length ? diagList.filter(t => diagDone.has(t)).length / diagList.length : 1) + 0.35 * fs * (F.free ? dis : 1) + 0.4 * (removedOnce.size ? inN / total : 0) + (finished ? 0.1 : 0));
  }
  function exportState() {
    const screwOut = {};
    for (const [id, s] of Object.entries(screws)) screwOut[id] = { state: s.state, dmg: s.dmg, spare: !!s.spare };
    return {
      st: { ...st }, screws: screwOut, flags: { ...flags },
      oiled: [...oiled], removedOnce: [...removedOnce], diagDone: [...diagDone],
      history: history.slice(), replaced: [...replaced], stats: { ...stats },
      fstep, score, armed, finished, revealed, freeDone
    };
  }
  function importState(snap) {
    if (!snap || !snap.st) return false;
    for (const id of Object.keys(st)) if (snap.st[id] === 'in' || snap.st[id] === 'out') st[id] = snap.st[id];
    for (const [id, s] of Object.entries(snap.screws || {})) {
      if (!screws[id] || !s) continue;
      if (s.state === 'in' || s.state === 'out' || s.state === 'lost') screws[id].state = s.state;
      screws[id].dmg = s.dmg || 0; screws[id].prog = 0; screws[id].spare = !!s.spare;
    }
    const fl = snap.flags || {};
    flags.letdown = !!fl.letdown; flags.protector = !!fl.protector; flags.flipped = !!fl.flipped;
    flags.mvLoc = fl.mvLoc === 'holder' ? 'holder' : 'case';
    flags.holderSide = fl.holderSide === 'dial' ? 'dial' : 'bridge';
    oiled.clear(); (snap.oiled || []).forEach(id => { if (P[id]) oiled.add(id); });
    removedOnce.clear(); (snap.removedOnce || []).forEach(id => { if (P[id]) removedOnce.add(id); });
    diagDone.clear(); (snap.diagDone || []).forEach(t => diagDone.add(t));
    history.length = 0; (snap.history || []).forEach(id => { if (P[id]) history.push(id); });
    replaced.clear(); (snap.replaced || []).forEach(id => replaced.add(id));
    if (snap.stats) for (const k of Object.keys(stats)) if (typeof snap.stats[k] === 'number') stats[k] = snap.stats[k];
    fstep = Math.max(0, Math.min(F.steps.length, snap.fstep | 0));
    score = Math.max(0, Math.min(100, snap.score | 0));
    armed = snap.armed && P[snap.armed] ? snap.armed : null;
    finished = !!snap.finished; revealed = !!snap.revealed; freeDone = !!snap.freeDone;
    return true;
  }
  return {
    W, C, F, P, st, screws, flags, stats, story, quartz,
    get score() { return score; }, get finished() { return finished; }, get armed() { return armed; }, get fstep() { return fstep; },
    name, toolName, tapPart, tapChip, placeCheck, missSeat, screwTurn, swapPart, button, suggest, describe, hint, goal, progress, tgRead, running, amplitude, missingList, allIn, oilPending, replaced, removedOnce,
    screwsOf, access, oiled, history, exportState, importState
  };
}
