// ─────────────────────────────────────────────────────────────
// DATOS DEL JUEGO (data-driven): herramientas, piezas y casos.
// Para añadir un caso nuevo solo se agrega un objeto a CASES.
// Referencias entre paréntesis = nº de pieza ETA 2824-2
// (Communication technique ETA 2824-2, lista de componentes).
// ─────────────────────────────────────────────────────────────

export const TOOLS = [
  { id: 'timegrapher', name: 'Timegrapher', desc: 'Escucha el tic-tac y mide marcha (s/día), amplitud (°) y error de marcha (ms). Ángulo de levée del calibre: 50°.' },
  { id: 'compass', name: 'Brújula', desc: 'Si la aguja se mueve cerca del reloj, puede estar magnetizado.' },
  { id: 'demag', name: 'Desmagnetizador', short: 'Desmag.', desc: 'Campo alterno que elimina el magnetismo de las piezas de acero (sobre todo la espiral).' },
  { id: 'caseWrench', name: 'Llave de fondo', short: 'Llave fondo', desc: 'Llave tipo Jaxa: agarra las muescas del fondo roscado sin rayar el oro.' },
  { id: 'screwdriver', name: 'Destornillador', short: 'Destorn.', desc: 'Destornilladores de relojero (0,6–1,6 mm) para tornillos de puentes, rotor y módulo.' },
  { id: 'tweezers', name: 'Pinzas', desc: 'Pinzas antimagnéticas para levantar puentes, ruedas, el volante y resortes.' },
  { id: 'holder', name: 'Soporte', desc: 'Soporte de movimiento: sujeta la máquina fuera de la caja.' },
  { id: 'loupe', name: 'Lupa', desc: 'Lupa de relojero x5–x10 para inspeccionar rubíes, aceite, dientes y espiral.' },
  { id: 'cleaner', name: 'Limpieza', desc: 'Rodico, palillo y solvente de relojería para quitar aceite viejo.' },
  { id: 'oiler', name: 'Aceitera', desc: 'Aceitera fina con Moebius 9010 (aceite fino para rubíes del volante).' },
  { id: 'handLevers', name: 'Palancas agujas', short: 'Palancas', desc: 'Palancas para sacar agujas sin rayar la esfera.' },
  { id: 'blower', name: 'Pera de aire', short: 'Pera aire', desc: 'Sopla polvo sin tocar las piezas.' }
];

// Piezas que se pueden tocar. coveredBy = pieza que la tapa (para el mensaje "está tapado por…").
export const PARTS = {
  watch:        { name: 'el reloj' },
  caseback:     { name: 'el fondo roscado' },
  rotor:        { name: 'el rotor (masa oscilante 1143/1)', coveredBy: 'caseback' },
  stem:         { name: 'la tija y corona (401)', coveredBy: 'caseback' },
  movement:     { name: 'el movimiento', coveredBy: 'stem' },
  auto:         { name: 'el módulo automático (1134)', coveredBy: 'rotor' },
  click:        { name: 'el trinquete / cliquet (425)', coveredBy: 'auto' },
  balscrew:     { name: 'el tornillo del puente de volante (5121)', coveredBy: 'rotor' },
  balance:      { name: 'el volante con su puente (721 + 121/3)', coveredBy: 'balscrew' },
  jewel:        { name: 'el rubí del amortiguador (3024)' },
  spring:       { name: 'el resorte del amortiguador' },
  palletBridge: { name: 'el puente de áncora (125)', coveredBy: 'balance' },
  palletFork:   { name: 'el áncora (710)', coveredBy: 'palletBridge' },
  ratchet:      { name: 'el rochet (415)', coveredBy: 'auto' },
  crownWheel:   { name: 'la rueda de corona (420)', coveredBy: 'auto' },
  barrelBridge: { name: 'el puente de barrilete (105)', coveredBy: 'ratchet' },
  barrel:       { name: 'el barrilete (180/1)', coveredBy: 'barrelBridge' },
  trainBridge:  { name: 'el puente de rodaje (110)', coveredBy: 'auto' },
  secondWheel:  { name: 'la rueda de segundos (227)', coveredBy: 'trainBridge' },
  thirdWheel:   { name: 'la rueda media (210)', coveredBy: 'trainBridge' },
  escapeWheel:  { name: 'la rueda de escape (705)', coveredBy: 'trainBridge' },
  interWheel:   { name: 'la rueda intermedia (203)', coveredBy: 'trainBridge' },
  holderBench:  { name: 'el soporte de movimiento' },
  timegrapher3d:{ name: 'el timegrapher' }
};

// Acciones disponibles en "done": msg, tg, flip, view, remove, toHolder, letdown,
// toInspect, reveal, openSpring, clean, oil, healthy.
const DIAG = 'Diagnóstico', DES = 'Desarme', REP = 'Reparación', MON = 'Montaje', PRU = 'Prueba';

const CASEBACK_TO_BALANCE = [
  { id: 'caseback', phase: DES, view: 'back', tool: 'caseWrench', target: 'caseback', title: 'Abre el fondo roscado',
    wrong: '¡Cuidado, rayarías el oro! El ZARUMEI tiene <b>fondo roscado</b>: usa la llave de fondo en las muescas.',
    done: [{ remove: ['caseback'], unscrew: true }, { msg: '✅ Fondo fuera (gira a la izquierda). La junta se revisa y engrasa al cerrar.' }] },
  { id: 'rotor', phase: DES, view: 'back', tool: 'screwdriver', target: 'rotor', title: 'Quita el rotor (tornillo central del rodamiento)',
    wrong: 'El rotor va sujeto por el tornillo de su rodamiento de bolas (51497). Destornillador.',
    done: [{ remove: ['rotor'] }, { msg: '✅ Rotor fuera. Se ven el módulo automático y el volante latiendo.' }] },
  { id: 'stem', phase: DES, view: 'back', tool: 'screwdriver', target: 'stem', title: 'Suelta la tija: presiona el empujador de la tirette',
    wrong: 'Con la corona en posición de puesta en hora, presiona el empujador de la tirette (443/1) con un destornillador fino y saca la corona con su tija.',
    done: [{ remove: ['stem'] }, { msg: '✅ Salió la corona con su tija.' }] },
  { id: 'movement', phase: DES, view: 'back', tool: 'holder', target: 'movement', title: 'Saca el movimiento de la caja al soporte',
    wrong: 'El movimiento sale de la caja directo a un <b>soporte de movimiento</b>; nunca se trabaja suelto.',
    done: [{ toHolder: true }, { view: 'holder' }, { msg: '✅ Movimiento en el soporte LA FURY. Caja aparte.' }] },
  { id: 'auto', phase: DES, view: 'holder', tool: 'screwdriver', target: 'auto', title: 'Quita el módulo automático (2 tornillos 51134)',
    wrong: 'El bastidor del automático (1134) va con 2 tornillos. Destornillador.',
    done: [{ remove: ['auto'] }, { msg: '✅ Módulo automático fuera: se ven el rochet, la rueda de corona y el cliquet.' }] },
  { id: 'letdown', phase: DES, view: 'holder', tool: 'tweezers', target: 'click', title: 'Descarga el muelle real: libera el cliquet con pinzas',
    wrong: 'Antes de tocar volante o áncora se <b>descarga el muelle real</b>: sujeta la corona y libera el cliquet (425) con las pinzas, poco a poco.',
    done: [{ letdown: true }, { msg: '✅ Muelle real descargado de forma controlada. El volante se detiene: ya es seguro tocar el escape.' }] },
  { id: 'balscrew', phase: DES, view: 'holder', tool: 'screwdriver', target: 'balscrew', title: 'Quita el tornillo del puente de volante (5121)',
    wrong: 'El puente de volante está atornillado. Primero el destornillador.',
    done: [{ remove: ['balscrew'] }, { msg: '✅ Tornillo del puente de volante fuera.' }] }
];

export const CASES = [
  {
    id: 'atrasa',
    title: 'Caso 1 · "Se atrasa"',
    subtitle: 'Diagnóstico y reparación (16 pasos)',
    ticket: {
      cliente: 'Sr. Díaz — Miami, FL',
      reloj: 'ZARUMEI Oro "Miami" (automático, 40 mm)',
      calibre: 'ZR-28 (automático, 4 Hz, 25 rubíes)',
      queja: '"Se atrasa casi un minuto al día."'
    },
    start: { amp: 188, running: true },
    intro: 'El cliente dice que <b>se atrasa</b>. ¿Qué hace primero un buen relojero? Elige una herramienta.',
    steps: [
      { id: 'tg1', phase: DIAG, view: 'front', tool: 'timegrapher', target: 'watch', title: 'Mide el reloj en el timegrapher',
        wrong: 'Antes de abrir nada, un relojero <b>mide</b>. Usa el timegrapher sobre el reloj.',
        done: [{ tg: { rate: -52, amp: 188, be: 0.4, note: 'La línea baja = el reloj <b>pierde</b> tiempo. Amplitud muy baja (sana: 270–310° con cuerda completa): algo <b>frena el volante</b>. El error de marcha está bien.' } },
               { msg: '📈 −52 s/día y solo 188° de amplitud. Algo está frenando el volante.' }] },
      { id: 'compass', phase: DIAG, view: 'front', tool: 'compass', target: 'watch', title: 'Descarta magnetismo con la brújula',
        wrong: 'Descarta primero lo fácil: ¿está magnetizado? Usa la brújula.',
        done: [{ msg: '🧭 La aguja no se mueve: no parece magnetizado. Además, el magnetismo suele hacer que el reloj se <b>adelante</b>. Toca abrir: volteando el reloj…' }, { flip: 'back' }] },
      ...CASEBACK_TO_BALANCE,
      { id: 'balance', phase: DES, view: 'holder', tool: 'tweezers', target: 'balance', title: 'Levanta el puente de volante con el volante',
        wrong: 'El volante con su espiral es lo más delicado: se levanta con <b>pinzas</b>, junto con su puente.',
        done: [{ toInspect: 'balance' }, { view: 'zoom' }, { msg: '✅ Volante fuera, sobre la alfombrilla. Acércate con la lupa al amortiguador.' }] },
      { id: 'inspect', phase: DIAG, view: 'zoom', tool: 'loupe', target: 'jewel', title: 'Inspecciona el rubí del amortiguador con la lupa',
        wrong: 'Antes de tocar, <b>mira</b>. Lupa.',
        done: [{ reveal: true }, { msg: '🔍 <b>¡Falla encontrada!</b> Aceite <b>seco y oscurecido</b> en el rubí del volante: fricción en el pivote → baja amplitud → se atrasa.' }] },
      { id: 'spring', phase: REP, view: 'zoom', tool: 'tweezers', target: 'spring', title: 'Abre el resorte (lira) del amortiguador',
        wrong: 'El resorte en forma de lira se abre con la punta de las pinzas, sin sacarlo del todo.',
        done: [{ openSpring: true }, { msg: '✅ Resorte abierto: ya salen la piedra de tope y el rubí.' }] },
      { id: 'clean', phase: REP, view: 'zoom', tool: 'cleaner', target: 'jewel', title: 'Limpia el aceite viejo',
        wrong: 'Nunca aceite nuevo sobre aceite viejo. Primero <b>limpia</b>.',
        done: [{ clean: true }, { msg: '✅ Rubí y piedra de tope limpios.' }] },
      { id: 'oil', phase: REP, view: 'zoom', tool: 'oiler', target: 'jewel', title: 'Aceita con Moebius 9010',
        wrong: 'Ahora lubrica: aceitera con 9010, gota pequeña y centrada.',
        done: [{ oil: true }, { msg: '✅ Gota de 9010 centrada (≈½–¾ de la piedra). Pulsa <b>Reensamblar</b>.' }] },
      { id: 'reassemble', phase: MON, view: 'zoom', button: true, title: 'Reensambla en orden inverso', wrong: 'Pulsa «Reensamblar».' },
      { id: 'tg2', phase: PRU, view: 'front', tool: 'timegrapher', target: 'watch', title: 'Prueba final en el timegrapher',
        wrong: 'Para entregar el reloj hay que comprobarlo en el timegrapher.',
        done: [{ tg: { rate: 3, amp: 286, be: 0.2, note: 'Línea casi plana: <b>+3 s/día</b> con amplitud sana. ¡Listo para el cliente!' } }, { msg: '🏁 +3 s/día y 286°. ¡Reparado!' }, { finish: true }] }
    ],
    lessons: [
      'Primero se mide (timegrapher) y se descarta lo fácil (magnetismo).',
      'Amplitud baja + atraso = fricción o falta de energía; el magnetismo normalmente <b>adelanta</b>.',
      'Se descarga el muelle real antes de quitar volante o escape.',
      'Nunca aceite nuevo sobre viejo: limpiar y luego 9010.'
    ],
    note: 'En un taller real, aceite seco en un punto suele significar servicio completo del movimiento. Este caso lo simplifica.'
  },
  {
    id: 'practica',
    title: 'Práctica · Desarme lado puentes',
    subtitle: 'Orden real ETA 2824-2 / SW200-1 (23 pasos)',
    ticket: {
      cliente: 'Escuela LA FURY',
      reloj: 'ZARUMEI Oro "Miami"',
      calibre: 'ZR-28 (arquitectura tipo 2824/SW200)',
      queja: 'Práctica: desarma el lado de puentes en el orden real del fabricante (inverso de su orden de montaje).'
    },
    start: { amp: 285, running: true },
    intro: 'Modo práctica: desarma el movimiento por el lado de puentes en el <b>orden real</b>. Voltea el reloj y empieza por el fondo.',
    steps: [
      { id: 'flip', phase: DES, view: 'front', button: 'Voltear reloj', title: 'Voltea el reloj', wrong: 'Pulsa «Voltear reloj».', done: [{ flip: 'back' }] },
      ...CASEBACK_TO_BALANCE,
      { id: 'balance', phase: DES, view: 'holder', tool: 'tweezers', target: 'balance', title: 'Levanta el puente de volante con el volante (121/3 + 721)',
        wrong: 'El volante se levanta con pinzas junto con su puente.', done: [{ remove: ['balance'] }, { msg: '✅ Volante fuera.' }] },
      { id: 'palletBridge', phase: DES, view: 'holder', tool: 'screwdriver', target: 'palletBridge', title: 'Quita el puente de áncora (125, 2 tornillos)',
        wrong: 'El puente de áncora va atornillado.', done: [{ remove: ['palletBridge'] }, { msg: '✅ Puente de áncora fuera.' }] },
      { id: 'palletFork', phase: DES, view: 'holder', tool: 'tweezers', target: 'palletFork', title: 'Saca el áncora (710)',
        wrong: 'El áncora se saca con pinzas.', done: [{ remove: ['palletFork'] }, { msg: '✅ Áncora fuera.' }] },
      { id: 'ratchet', phase: DES, view: 'holder', tool: 'screwdriver', target: 'ratchet', title: 'Quita el rochet (415, tornillo 5415)',
        wrong: 'El rochet va con tornillo.', done: [{ remove: ['ratchet'] }, { msg: '✅ Rochet fuera.' }] },
      { id: 'click', phase: DES, view: 'holder', tool: 'tweezers', target: 'click', title: 'Saca el cliquet (425) y su resorte (430)',
        wrong: 'El cliquet y su resorte se sacan con pinzas.', done: [{ remove: ['click'] }, { msg: '✅ Cliquet fuera.' }] },
      { id: 'crownWheel', phase: DES, view: 'holder', tool: 'screwdriver', target: 'crownWheel', title: 'Quita la rueda de corona (420, tornillo 5420)',
        wrong: 'La rueda de corona va con tornillo (ojo con el sentido de la rosca según el calibre).', done: [{ remove: ['crownWheel'] }, { msg: '✅ Rueda de corona fuera.' }] },
      { id: 'barrelBridge', phase: DES, view: 'holder', tool: 'screwdriver', target: 'barrelBridge', title: 'Quita el puente de barrilete (105, 3 tornillos)',
        wrong: 'El puente de barrilete va con 3 tornillos.', done: [{ remove: ['barrelBridge'] }, { msg: '✅ Puente de barrilete fuera.' }] },
      { id: 'barrel', phase: DES, view: 'holder', tool: 'tweezers', target: 'barrel', title: 'Saca el barrilete (180/1)',
        wrong: 'El barrilete se saca con pinzas.', done: [{ remove: ['barrel'] }, { msg: '✅ Barrilete fuera (dentro: muelle real 771).' }] },
      { id: 'trainBridge', phase: DES, view: 'holder', tool: 'screwdriver', target: 'trainBridge', title: 'Quita el puente de rodaje (110, 2 tornillos)',
        wrong: 'El puente de rodaje va con 2 tornillos.', done: [{ remove: ['trainBridge'] }, { msg: '✅ Puente de rodaje fuera: se ve todo el tren de ruedas.' }] },
      { id: 'secondWheel', phase: DES, view: 'holder', tool: 'tweezers', target: 'secondWheel', title: 'Saca la rueda de segundos (227)', wrong: 'Ruedas: con pinzas.', done: [{ remove: ['secondWheel'] }] },
      { id: 'thirdWheel', phase: DES, view: 'holder', tool: 'tweezers', target: 'thirdWheel', title: 'Saca la rueda media (210)', wrong: 'Ruedas: con pinzas.', done: [{ remove: ['thirdWheel'] }] },
      { id: 'escapeWheel', phase: DES, view: 'holder', tool: 'tweezers', target: 'escapeWheel', title: 'Saca la rueda de escape (705)', wrong: 'Ruedas: con pinzas.', done: [{ remove: ['escapeWheel'] }] },
      { id: 'interWheel', phase: DES, view: 'holder', tool: 'tweezers', target: 'interWheel', title: 'Saca la rueda intermedia (203)', wrong: 'Ruedas: con pinzas.', done: [{ remove: ['interWheel'] }, { msg: '✅ Lado de puentes desarmado. Pulsa <b>Reensamblar</b>.' }] },
      { id: 'reassemble', phase: MON, view: 'holder', button: true, title: 'Reensambla en orden inverso', wrong: 'Pulsa «Reensamblar».' },
      { id: 'tg', phase: PRU, view: 'front', tool: 'timegrapher', target: 'watch', title: 'Comprueba en el timegrapher',
        wrong: 'Comprueba el reloj en el timegrapher.',
        done: [{ tg: { rate: 2, amp: 288, be: 0.2, note: 'Todo en orden tras el montaje.' } }, { finish: true }] }
    ],
    lessons: [
      'Orden de desarme = inverso del orden de montaje del fabricante.',
      'Energía fuera (cliquet) antes del escape.',
      'Volante → áncora → rochet/cliquet/rueda de corona → barrilete → rodaje.'
    ],
    note: 'El lado esfera (calendario, minutería, remontoir) llega en la siguiente versión.'
  }
];
