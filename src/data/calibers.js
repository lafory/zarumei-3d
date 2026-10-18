// ─────────────────────────────────────────────────────────────────────────────
// CALIBRES (data-driven). Cada pieza:
//   side: 'case' (se trabaja con el reloj volteado y el movimiento en la caja)
//         'bridge' (lado puentes: en la caja sin fondo, o en el soporte boca arriba)
//         'dial'   (lado esfera: solo en el soporte, volteado)
//   coveredBy: piezas que hay que quitar ANTES (y que se montan DESPUÉS).
//   tool: herramienta para quitarla · placeTool: para montarla (si es otra).
//   screws: cada tornillo con su punta (s, mm), su tipo (k) y su posición en la pieza (p = [x, y, z] en mm).
//   requires: estados necesarios para quitarla (letdown = muelle real descargado, protector = protector de esfera puesto).
//   action: acción especial con la misma herramienta (p. ej. descargar el muelle real en el cliquet).
//   oil: lubricación obligatoria al montar · when 'after' (tras montar y atornillar) o 'before' (en la bandeja).
// Las referencias entre paréntesis son de la lista de piezas ETA 2824-2 donde las conocemos con certeza.
// ─────────────────────────────────────────────────────────────────────────────

const HANDS_DIAL = (dialScrews) => [
  { id: 'secHand', name: 'el segundero', side: 'dial', coveredBy: [], tool: 'handLevers', placeTool: 'handPress', requires: ['protector'], placeRequires: ['protector'] },
  { id: 'minHand', name: 'la aguja de minutos', side: 'dial', coveredBy: ['secHand'], tool: 'handLevers', placeTool: 'handPress', requires: ['protector'], placeRequires: ['protector'] },
  { id: 'hourHand', name: 'la aguja de horas', side: 'dial', coveredBy: ['minHand'], tool: 'handLevers', placeTool: 'handPress', requires: ['protector'], placeRequires: ['protector'], placeMsg: 'Aguja de horas clavada a las 12:00, justo en el salto de fecha.' },
  { id: 'dial', name: 'la esfera', side: 'dial', coveredBy: ['hourHand'], tool: 'tweezers', screws: dialScrews }
];

export const CALIBERS = {
  ZR28: {
    id: 'ZR28', name: 'ZR-28', type: 'auto',
    desc: 'Automático, 4 Hz (28.800 A/h), 25 rubíes, Ø 25,6 mm. Arquitectura tipo ETA 2824-2 / Sellita SW200-1.',
    lift: 50, ampOk: [270, 310],
    parts: [
      { id: 'caseback', name: 'el fondo roscado', side: 'case', coveredBy: [], tool: 'caseWrench', oil: { when: 'before', lube: 'grasa de silicona', msg: 'Grasa de silicona en la junta del fondo.' } },
      { id: 'rotor', name: 'el rotor (masa oscilante 1143/1)', side: 'bridge', coveredBy: ['caseback'], tool: 'tweezers', screws: [{ s: 1.6, k: 'rotor', p: [0, 0.6, 0] }] },
      { id: 'stem', name: 'la tija y corona (401)', side: 'case', coveredBy: ['caseback'], tool: 'screwdriver', anySize: true, placeTool: 'tweezers', removeMsg: 'Presionaste el empujador de la tirette y salió la corona con su tija.' },
      { id: 'clamps', name: 'las bridas de caja', side: 'case', coveredBy: ['caseback'], tool: 'tweezers', screws: [{ s: 1.2, k: 'clamp', p: [-7.2, 1.62, 10.0] }, { s: 1.2, k: 'clamp', p: [10.4, 1.62, -6.0] }] },
      { id: 'movement', name: 'el movimiento', side: 'case', coveredBy: ['stem', 'clamps'], tool: 'holder', placeNeedsDial: true },
      { id: 'auto', name: 'el módulo automático (1134)', side: 'bridge', coveredBy: ['rotor'], tool: 'tweezers', screws: [{ s: 1.2, k: 'auto', p: [-7.4, 0.7, -4.6] }, { s: 1.2, k: 'auto', p: [7.0, 0.7, -8.4] }] },
      { id: 'balance', name: 'el volante con su puente (721 + 121/3)', side: 'bridge', coveredBy: ['rotor'], tool: 'tweezers', requires: ['letdown'], inspect: true, screws: [{ s: 1.2, k: 'cock', p: [5.2, 1.2, -2.7] }] },
      { id: 'palletBridge', name: 'el puente de áncora (125)', side: 'bridge', coveredBy: ['balance'], tool: 'tweezers', requires: ['letdown'], screws: [{ s: 1.0, k: 'pallet', p: [6.2, 0.7, 3.4] }, { s: 1.0, k: 'pallet', p: [2.6, 0.7, 4.4] }], oil: { when: 'after', lube: '9415', msg: '9415 en las paletas del áncora (½ de la paleta de salida).' } },
      { id: 'palletFork', name: 'el áncora (710)', side: 'bridge', coveredBy: ['palletBridge'], tool: 'tweezers', requires: ['letdown'] },
      { id: 'ratchet', name: 'el rochet (415)', side: 'bridge', coveredBy: ['auto'], tool: 'tweezers', requires: ['letdown'], screws: [{ s: 1.4, k: 'ratchet', p: [0, 0.35, 0] }] },
      { id: 'crownWheel', name: 'la rueda de corona (420)', side: 'bridge', coveredBy: ['auto'], tool: 'tweezers', requires: ['letdown'], screws: [{ s: 1.0, k: 'crownLH', lh: true, p: [0, 0.3, 0] }] },
      { id: 'click', name: 'el cliquet (425)', side: 'bridge', coveredBy: ['auto', 'ratchet', 'crownWheel'], tool: 'tweezers',
        action: { tool: 'tweezers', flag: 'letdown', needOut: ['auto'], msg: '✅ Muelle real descargado poco a poco (corona sujeta, cliquet liberado). El volante se detiene: ya es seguro tocar el escape.' } },
      { id: 'barrelBridge', name: 'el puente de barrilete (105)', side: 'bridge', coveredBy: ['ratchet', 'crownWheel', 'click'], tool: 'tweezers', screws: [{ s: 1.2, k: 'bridge', p: [-10.5, 0.8, -3.6] }, { s: 1.2, k: 'bridge', p: [-2.2, 0.8, -10.8] }, { s: 1.2, k: 'bridge', p: [-0.4, 0.8, -3.2] }] },
      { id: 'barrel', name: 'el barrilete (180/1)', side: 'bridge', coveredBy: ['barrelBridge'], tool: 'tweezers', oil: { when: 'after', lube: '8217', msg: 'Grasa 8217 en la pared del barrilete y aceite en sus ejes.' } },
      { id: 'trainBridge', name: 'el puente de rodaje (110)', side: 'bridge', coveredBy: ['auto', 'palletFork'], tool: 'tweezers', requires: ['letdown'], screws: [{ s: 1.2, k: 'bridge', p: [9.2, 0.8, -6.2] }, { s: 1.2, k: 'bridge', p: [4.2, 0.8, -10.4] }], oil: { when: 'after', lube: '9010', msg: '9010 en los rubíes del rodaje.' } },
      { id: 'secondWheel', name: 'la rueda de segundos (227)', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'thirdWheel', name: 'la rueda media (210)', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'escapeWheel', name: 'la rueda de escape (705)', side: 'bridge', coveredBy: ['trainBridge', 'palletFork'], tool: 'tweezers' },
      { id: 'interWheel', name: 'la rueda intermedia (203)', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      // lado esfera (coordenadas del grupo dialSide: +Y hacia la esfera, 12h = −Z, 3h = +X)
      ...HANDS_DIAL([{ s: 0.8, k: 'dial', p: [-9.2, -0.6, -9.2], radial: true }, { s: 0.8, k: 'dial', p: [9.2, -0.6, 9.2], radial: true }]),
      { id: 'datePlate', name: 'la placa sujeta-fecha', side: 'dial', coveredBy: ['dial'], tool: 'tweezers', screws: [{ s: 1.0, k: 'date', p: [9.6, 1.2, -5.5] }, { s: 1.0, k: 'date', p: [-9.6, 1.2, -5.5] }, { s: 1.0, k: 'date', p: [0, 1.2, 11.0] }] },
      { id: 'dateDisc', name: 'el disco de fecha', side: 'dial', coveredBy: ['datePlate'], tool: 'tweezers' },
      { id: 'hourWheel', name: 'la rueda de horas', side: 'dial', coveredBy: ['datePlate'], tool: 'tweezers' },
      { id: 'dateDriver', name: 'la rueda arrastradora de fecha', side: 'dial', coveredBy: ['datePlate'], tool: 'tweezers' },
      { id: 'minuteWheel', name: 'la rueda de minutería', side: 'dial', coveredBy: ['datePlate'], tool: 'tweezers' },
      { id: 'cannonPinion', name: 'el piñón de minutos (cañón)', side: 'dial', coveredBy: ['hourWheel', 'minuteWheel'], tool: 'handLevers', placeTool: 'tweezers' },
      { id: 'keylessPlate', name: 'el resorte-placa de remontoir', side: 'dial', coveredBy: ['dial'], tool: 'tweezers', screws: [{ s: 1.0, k: 'keyless', p: [8.6, 0.7, -2.4] }] },
      { id: 'yoke', name: 'el balancín (yoke)', side: 'dial', coveredBy: ['keylessPlate'], tool: 'tweezers' },
      { id: 'settingLever', name: 'la tirette (palanca de ajuste)', side: 'dial', coveredBy: ['keylessPlate', 'yoke'], tool: 'tweezers' },
      { id: 'stopLever', name: 'la palanca de stop (paro del volante)', side: 'dial', coveredBy: ['settingLever'], tool: 'tweezers' },
      { id: 'slidingPinion', name: 'el piñón corredizo', side: 'dial', coveredBy: ['yoke'], tool: 'tweezers' },
      { id: 'windingPinion', name: 'el piñón de remontoir', side: 'dial', coveredBy: ['slidingPinion'], tool: 'tweezers' }
    ]
  },
  ZQ11: {
    id: 'ZQ11', name: 'ZQ-11', type: 'quartz',
    desc: 'Cuarzo fino de 3 agujas, 32.768 Hz, motor paso a paso, pila SR626SW (377), Ø 23,3 mm, 2,5 mm de alto. Arquitectura tipo Ronda 762 / Miyota GL20.',
    parts: [
      { id: 'caseback', name: 'el fondo a presión', side: 'case', coveredBy: [], tool: 'caseKnife', placeTool: 'caseKnife', oil: { when: 'before', lube: 'grasa de silicona', msg: 'Grasa de silicona en la junta del fondo.' }, placeMsg: 'Fondo cerrado a presión (en un taller, con prensa de fondos).' },
      { id: 'stem', name: 'la tija y corona', side: 'case', coveredBy: ['caseback'], tool: 'screwdriver', anySize: true, placeTool: 'tweezers', removeMsg: 'Presionaste el pulsador de la tirette y salió la corona.' },
      { id: 'movement', name: 'el movimiento', side: 'case', coveredBy: ['stem'], tool: 'holder', placeNeedsDial: true },
      { id: 'batteryClamp', name: 'la brida de la pila', side: 'bridge', coveredBy: ['caseback'], tool: 'tweezers', screws: [{ s: 0.8, k: 'clampQ', p: [-8.9, 2.5, 6.1] }] },
      { id: 'battery', name: 'la pila SR626SW', side: 'bridge', coveredBy: ['batteryClamp'], tool: 'plasticTweezers' },
      { id: 'circuit', name: 'el circuito con el cuarzo', side: 'bridge', coveredBy: ['battery'], tool: 'tweezers', screws: [{ s: 1.0, k: 'circuit', p: [9.4, 0.32, 1.0] }] },
      { id: 'coil', name: 'la bobina con su estátor', side: 'bridge', coveredBy: ['circuit'], tool: 'tweezers', screws: [{ s: 1.0, k: 'coil', p: [8.6, 1.0, -6.3] }] },
      { id: 'trainBridge', name: 'el puente de rodaje', side: 'bridge', coveredBy: ['circuit'], tool: 'tweezers', screws: [{ s: 1.0, k: 'bridgeQ', p: [-8.0, 0.6, 0.6] }, { s: 1.0, k: 'bridgeQ', p: [1.8, 0.6, -8.4] }], oil: { when: 'after', lube: '9010', msg: '9010 (gota mínima) en los pivotes del rodaje.' } },
      { id: 'stepRotor', name: 'el rotor del motor paso a paso', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'fifthWheel', name: 'la rueda intermedia', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'thirdWheel', name: 'la rueda media', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'secondWheel', name: 'la rueda de segundos', side: 'bridge', coveredBy: ['trainBridge'], tool: 'tweezers' },
      { id: 'centerWheel', name: 'la rueda de centro', side: 'bridge', coveredBy: ['secondWheel'], tool: 'tweezers' },
      ...HANDS_DIAL([]),
      { id: 'hourWheel', name: 'la rueda de horas', side: 'dial', coveredBy: ['dial'], tool: 'tweezers' },
      { id: 'minuteWheel', name: 'la rueda de minutería', side: 'dial', coveredBy: ['dial'], tool: 'tweezers' },
      { id: 'keylessPlate', name: 'la placa de remontoir', side: 'dial', coveredBy: ['dial'], tool: 'tweezers', screws: [{ s: 0.8, k: 'keyless', p: [7.4, 0.42, 2.6] }] },
      { id: 'yoke', name: 'el balancín', side: 'dial', coveredBy: ['keylessPlate'], tool: 'tweezers' },
      { id: 'settingLever', name: 'la tirette', side: 'dial', coveredBy: ['keylessPlate', 'yoke'], tool: 'tweezers' }
    ]
  }
};
