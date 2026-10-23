// Modo Peritaje. El banco y las herramientas son los de siempre: aquí solo viven
// el cuento del vendedor, el veredicto y el precio. El reloj que se monta en la
// escena es el de verdad (watchId). Las pistas no pueden contradecir lo que esa
// caja, esa esfera o ese rotor ya dicen en 3D.
// Inventario, ojo del taller y tratos: localStorage de este teléfono. zarumei.peritaje.v1
import { fmtPrice } from './data/boutique.js';

const KEY = 'zarumei.peritaje.v1';

export const VERDICTS = [
  { id: 'real', label: 'Real' },
  { id: 'fake', label: 'Falso' },
  { id: 'modified', label: 'Modificado' },
  { id: 'franken', label: 'Franken' }
];

export const TRUTH_LABEL = { real: 'Real', fake: 'Falso', modified: 'Modificado', franken: 'Franken' };

// any: marcas que deja el banco (tg, loupe:pieza, remove:pieza, meter:pieza).
export const OFFERS = [
  {
    id: 'mesa-cuba',
    truth: 'real',
    watchId: 'cuba',
    fair: 1800,
    floor: 1500,
    floorBlind: 2050,
    claim: {
      title: 'ZARUMEI Cuba Azul',
      line: 'ZR-28 automático · acero · 200 m',
      story: 'De Coral Gables. Dice que es de la casa, poco uso, y que el fondo no se ha abierto.',
      ask: 2200
    },
    checks: [
      { id: 'tg', any: ['tg'], hint: 'Pon el timegrapher y toca el reloj.', text: 'Timegrapher en automático, marcha sana. No es cuarzo ni está muerto.' },
      { id: 'dial', any: ['loupe:dial', 'loupe:hourHand', 'loupe:minHand', 'loupe:secHand'], hint: 'Lupa sobre la esfera o las agujas.', text: 'La lupa ve la esfera de fábrica: sol, oso y Cuba Azul. Índices sin repinte.' },
      { id: 'back', any: ['remove:caseback'], hint: 'Voltea el reloj y abre el fondo roscado con la llave.', text: 'Fondo roscado, Nº 002, 200 m, acero. El grabado es el de esta Cuba Azul.' },
      { id: 'rotor', any: ['loupe:rotor'], hint: 'Con el fondo fuera, lupa en el rotor.', text: 'El rotor dice ZARUMEI · CUBA AZUL. El calibre es el de esta caja.' }
    ]
  },
  {
    id: 'mesa-falso',
    truth: 'fake',
    watchId: 'lira',
    fair: 700,
    floor: 400,
    floorBlind: 4200,
    claim: {
      title: 'ZARUMEI Oro «Miami»',
      line: 'ZR-28 automático · oro 18k · 100 m',
      story: 'Un conocido del muelle. «Es el Miami de oro, automático. Los papeles van en camino».',
      ask: 4800
    },
    checks: [
      { id: 'tg', any: ['tg'], hint: 'Pon el timegrapher y toca el reloj.', text: 'El timegrapher entra en modo cuarzo: un impulso por segundo. Un Miami ZR-28 no hace eso.' },
      { id: 'dial', any: ['loupe:dial', 'loupe:hourHand', 'loupe:minHand', 'loupe:secHand'], hint: 'Lupa sobre la esfera o las agujas.', text: 'Esfera crema, y dice QUARTZ. No es la esfera Miami.' },
      { id: 'back', any: ['remove:caseback'], hint: 'Voltea el reloj y abre el fondo a presión con la cuchilla.', text: 'Fondo a presión: QUARTZ, 3 atm. El Miami de verdad lleva fondo roscado y 100 m.' },
      { id: 'meter', any: ['meter:battery'], hint: 'Fondo abierto: multímetro sobre la pila.', text: 'Hay pila SR626SW. El automático que te cuentan no lleva pila.' }
    ]
  },
  {
    id: 'mesa-ancla',
    truth: 'modified',
    watchId: 'ancla',
    fair: 1900,
    floor: 1500,
    floorBlind: 2400,
    claim: {
      title: 'ZARUMEI Ancla',
      line: 'ZR-28 · oro 18k · esfera de la casa',
      story: 'Lo trae la dueña. «Ancla original, esfera de casa, recién puesto a punto».',
      ask: 2600
    },
    checks: [
      { id: 'tg', any: ['tg'], hint: 'Pon el timegrapher y toca el reloj.', text: 'Automático con amplitud sana. El calibre late: no es una imitación muerta.' },
      { id: 'dial', any: ['loupe:dial', 'loupe:hourHand', 'loupe:minHand', 'loupe:secHand'], hint: 'Lupa sobre la esfera o las agujas.', text: 'La lupa delata la esfera: índices reimpresos y lume demasiado blanco. No salió así de la casa.' },
      { id: 'back', any: ['remove:caseback'], hint: 'Voltea el reloj y abre el fondo roscado con la llave.', text: 'El fondo es el del Ancla, Nº 050, oro 18k. La caja sí es de este modelo.' },
      { id: 'rotor', any: ['loupe:rotor'], hint: 'Con el fondo fuera, lupa en el rotor.', text: 'Rotor ZARUMEI · ANCLA. El movimiento corresponde a la caja: no es un calibre prestado.' }
    ]
  },
  {
    id: 'mesa-franken',
    truth: 'franken',
    watchId: 'octava',
    fair: 2100,
    floor: 1700,
    floorBlind: 6200,
    claim: {
      title: 'ZARUMEI Nácar',
      line: 'ZX-60 · turbillón · acero y cerámica',
      story: 'Dice que es el Nácar, el de sesenta piezas, «completo y sin abrir». Pide precio de turbillón.',
      ask: 7400
    },
    checks: [
      { id: 'tg', any: ['tg'], hint: 'Pon el timegrapher y toca el reloj.', text: 'Late a 4 Hz como un ZR-28. Un ZX-60 de turbillón no se oye así.' },
      { id: 'dial', any: ['loupe:dial', 'loupe:hourHand', 'loupe:minHand', 'loupe:secHand'], hint: 'Lupa sobre la esfera o las agujas.', text: 'Esfera geométrica azul de la Octava. El Nácar lleva nácar calado, no este dibujo.' },
      { id: 'back', any: ['remove:caseback'], hint: 'Voltea el reloj y abre el fondo roscado con la llave.', text: 'El fondo dice OCTAVA, automático, Nº 051. No dice Nácar ni ZX-60.' },
      { id: 'rotor', any: ['loupe:rotor'], hint: 'Con el fondo fuera, lupa en el rotor.', text: 'Rotor de ZR-28 Octava. Piezas de la casa, pero de otro reloj: esto es un franken de historia, no el Nácar.' }
    ]
  }
];

const snap = (n) => Math.max(50, Math.round(n / 10) * 10);

export function offerById(id) { return OFFERS.find(o => o.id === id) || null; }

function blank() { return { rep: 50, inventory: [], closed: [] }; }

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return blank();
    const rep = Number.isFinite(+raw.rep) ? Math.max(0, Math.min(100, Math.round(+raw.rep))) : 50;
    return {
      rep,
      inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
      closed: Array.isArray(raw.closed) ? raw.closed.filter(id => typeof id === 'string') : []
    };
  } catch { return blank(); }
}

function write(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* privado o lleno */ }
}

export function periState() { return read(); }
export function isClosed(id) { return read().closed.includes(id); }
export function inventory() { return read().inventory.slice(); }

export function nextLook(offer, found) {
  const miss = offer.checks.find(c => !found.has(c.id));
  return miss ? miss.hint : 'Ya miraste lo que importa. Da el veredicto.';
}

// Marca las miradas nuevas. found es un Set que esta función modifica.
export function takeLooks(offer, found, tags) {
  const fresh = [];
  for (const c of offer.checks) {
    if (found.has(c.id)) continue;
    if (!c.any.some(t => tags.includes(t))) continue;
    found.add(c.id);
    fresh.push(c.text);
  }
  return fresh;
}

// Precios de las cuatro frases. Si el veredicto es correcto, el «pago hasta» se apoya en lo que vale, no en el cuento.
export function quotes(offer, verdict) {
  const correct = verdict === offer.truth;
  const floor = correct ? offer.floor : offer.floorBlind;
  const ask = offer.claim.ask;
  const anchor = correct ? offer.fair : ask;
  return {
    correct,
    floor,
    mid: snap(Math.max(floor, (anchor + floor) / 2)),
    low: snap(floor * 0.9),
    hard: snap(floor * 0.75),
    close: snap(ask * 0.97)
  };
}

// choice: mid | low | hard | close. round 0..3 (cuatro intentos). No toca el almacén.
export function answer(offer, verdict, round, choice) {
  const q = quotes(offer, verdict);
  const price = q[choice];
  const last = round >= 3;
  if (price >= q.floor) {
    return { price, result: 'accept', correct: q.correct, line: `Hecho. ${fmtPrice(price)} y es tuyo.` };
  }
  if (choice === 'hard' && !q.correct && round >= 1) {
    return { price, result: 'walk', correct: q.correct, line: 'Con ese número, y sin tener claro el reloj, no seguimos.' };
  }
  if (last) {
    if (price >= q.floor * 0.92 && q.correct) {
      return { price: snap(q.floor), result: 'accept', correct: q.correct, line: `Última: te lo dejo en ${fmtPrice(snap(q.floor))}, porque lo miraste de verdad.` };
    }
    return { price, result: 'walk', correct: q.correct, line: 'No llegamos. Me lo llevo.' };
  }
  const slide = Math.max(0.12, 0.42 - round * 0.1);
  const counter = snap(q.floor + (offer.claim.ask - q.floor) * slide);
  const line = q.correct
    ? `Vi que lo abriste. Puedo bajar a ${fmtPrice(counter)}, y de ahí no me muevo.`
    : `Eso es poco para lo que te estoy contando. ${fmtPrice(counter)}, o lo ve otra persona.`;
  return { price, result: 'counter', correct: q.correct, counter, line };
}

// Escribe el trato. No cobra: el saldo del taller lo mueve quien llama.
export function recordDeal({ offer, verdict, paid, walked }) {
  const db = read();
  const correct = verdict === offer.truth;
  let delta = 0;
  let note = '';
  if (walked) {
    delta = correct ? 4 : -3;
    note = correct ? 'Te levantaste a tiempo.' : 'Te fuiste sin tenerlo claro.';
  } else {
    delta += correct ? 10 : -12;
    const over = paid > offer.fair * 1.12;
    if (offer.truth === 'fake' && !correct) {
      delta -= 10;
      note = 'Lo pagaste como si fuera de verdad. Es falso: sale caja y sale ojo.';
    } else if (offer.truth === 'fake') {
      if (over) { delta -= 6; note = 'Sabías que era falso, pero soltaste de más.'; }
      else { delta += 3; note = 'Falso, y lo pagaste por lo que es.'; }
    } else if (!correct) {
      if (over) delta -= 6;
      note = over ? 'Fallaste el peritaje y además pagaste de más.' : 'El reloj es tuyo, pero el veredicto no era ese.';
    } else if (over) {
      delta -= 4;
      note = 'El veredicto era el bueno, pero pagaste de más.';
    } else {
      delta += 4;
      note = 'Veredicto justo y precio justo.';
    }
    db.inventory.unshift({
      id: 'i' + Date.now().toString(36),
      offerId: offer.id,
      watchId: offer.watchId,
      truth: offer.truth,
      verdict,
      paid,
      worth: offer.fair,
      claim: offer.claim.title,
      at: Date.now()
    });
    db.inventory = db.inventory.slice(0, 24);
    if (!db.closed.includes(offer.id)) db.closed.push(offer.id);
  }
  db.rep = Math.max(0, Math.min(100, (db.rep || 50) + delta));
  write(db);
  return { rep: db.rep, delta, note, correct };
}
