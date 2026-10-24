// ─────────────────────────────────────────────────────────────────────────────
// FALLAS (data-driven). Se asignan a un caso de la Historia o se eligen en el modo Libre.
//   calibers: tipos de calibre donde tiene sentido ('auto' | 'quartz').
//   steps: pasos de reparación en orden. Cada paso:
//     tool + on (pieza o subpieza) + part (pieza que debe estar accesible o fuera) + need ('in' accesible | 'out' fuera, en la alfombrilla)
//     o bien removed: 'pieza' (se cumple al sacarla; al montarla se usa una nueva).
//     fx = efecto visual (reveal, openSpring, clean, oil, replace, demag, regulate, battery, coil).
//   tg: lecturas del timegrapher antes / después. meter: lecturas del multímetro. compass: si la brújula se mueve.
// ─────────────────────────────────────────────────────────────────────────────
export const FAULTS = {
  aceiteSeco: {
    id: 'aceiteSeco', name: 'Se atrasa · aceite seco en el volante', short: 'Se atrasa', calibers: ['auto'],
    symptom: '"Se atrasa casi un minuto al día."',
    tg: { before: { rate: -52, amp: 188, be: 0.4, note: 'La línea baja: el reloj <b>pierde</b> tiempo. Amplitud muy baja (sana: 270–310°): algo <b>frena el volante</b>.' } },
    steps: [
      { tool: 'loupe', on: 'jewel', part: 'balance', need: 'out', fx: 'reveal', title: 'Inspecciona el rubí del amortiguador con la lupa', msg: '🔍 <b>¡Falla encontrada!</b> Aceite <b>seco y oscurecido</b> en el rubí del volante: fricción en el pivote → baja amplitud → se atrasa.' },
      { tool: 'tweezers', on: 'spring', part: 'balance', need: 'out', fx: 'openSpring', title: 'Abre el resorte (lira) del amortiguador', msg: '✅ Resorte abierto: ya salen la piedra de tope y el rubí.' },
      { tool: 'cleaner', on: 'jewel', part: 'balance', need: 'out', fx: 'clean', title: 'Limpia el aceite viejo', msg: '✅ Rubí y piedra de tope limpios.' },
      { tool: 'oiler', on: 'jewel', part: 'balance', need: 'out', fx: 'oil', title: 'Aceita el rubí con 9010', msg: '✅ Gota de 9010 centrada (½–¾ de la piedra). Cierra el resorte y vuelve a montar.' }
    ],
    lessons: ['Primero se mide (timegrapher) y se descarta lo fácil (magnetismo).', 'Amplitud baja + atraso = fricción o falta de energía; el magnetismo normalmente <b>adelanta</b>.', 'Nunca aceite nuevo sobre aceite viejo: primero limpiar, luego 9010.']
  },
  magnetizado: {
    id: 'magnetizado', name: 'Se adelanta · magnetizado', short: 'Se adelanta', calibers: ['auto'], compass: true,
    symptom: '"Desde que lo dejé junto al altavoz se adelanta varios minutos al día."',
    tg: { before: { rate: 268, amp: 262, be: 1.9, noisy: true, note: 'Línea muy inclinada hacia arriba y "rota": se <b>adelanta</b> mucho. Las espiras de la espiral se pegan entre sí → típico <b>magnetismo</b>.' } },
    steps: [
      { tool: 'demag', on: 'watch', fx: 'demag', title: 'Desmagnetiza el reloj', msg: '🧲 Desmagnetizado: la brújula ya no se mueve. Comprueba con el timegrapher.' }
    ],
    lessons: ['El magnetismo pega las espiras de la espiral: el reloj se <b>adelanta</b> mucho y de forma irregular.', 'Se comprueba con brújula y se arregla con el desmagnetizador, sin desarmar.']
  },
  muelleDebil: {
    id: 'muelleDebil', name: 'Se para · muelle real fatigado', short: 'Se para', calibers: ['auto'],
    symptom: '"Se para por la noche aunque lo llevo todo el día."',
    tg: { before: { rate: -18, amp: 172, be: 0.5, note: 'Amplitud muy baja incluso con cuerda completa y el volante sano: falta <b>energía</b>. Sospecha del muelle real.' } },
    steps: [
      { tool: 'loupe', on: 'barrel', part: 'barrel', need: 'out', fx: 'reveal', title: 'Inspecciona el muelle real dentro del barrilete', msg: '🔍 <b>¡Falla encontrada!</b> El muelle real está <b>fatigado y deformado</b> (y la grasa seca): ya no da fuerza.' },
      { tool: 'tweezers', on: 'barrel', part: 'barrel', need: 'out', fx: 'replace', title: 'Cambia el muelle real (pieza nueva)', msg: '✅ Muelle real nuevo colocado en el barrilete con el arrollador.' },
      { tool: 'oiler', on: 'barrel', part: 'barrel', need: 'out', fx: 'oil', title: 'Engrasa la pared del barrilete (8217)', msg: '✅ Grasa 8217 en la pared interior del barrilete.' }
    ],
    lessons: ['Amplitud baja con el volante limpio apunta a falta de energía: el muelle real.', 'El muelle real se cambia por uno nuevo y la pared del barrilete se engrasa con 8217 (deslizamiento).']
  },
  ejeRoto: {
    id: 'ejeRoto', name: 'Golpe · eje de volante roto', short: 'Golpe', calibers: ['auto'],
    symptom: '"Se me cayó y se paró. Si lo agito, late un segundo y vuelve a pararse."',
    tg: { before: null },
    steps: [
      { tool: 'loupe', on: 'balance', part: 'balance', need: 'out', fx: 'reveal', title: 'Inspecciona el eje del volante con la lupa', msg: '🔍 <b>¡Falla encontrada!</b> El pivote superior del <b>eje de volante está roto</b> por el golpe.' },
      { tool: 'tweezers', on: 'balance', part: 'balance', need: 'out', fx: 'replace', title: 'Coloca un volante completo de repuesto', msg: '✅ Volante de repuesto (eje nuevo) colocado en su puente. Comprueba la espiral plana y centrada.' }
    ],
    lessons: ['Tras un golpe, si el volante no late, se mira el eje: los pivotes son finísimos (≈0,07 mm).', 'En calibres de serie se cambia el volante completo o el eje.']
  },
  desregulado: {
    id: 'desregulado', name: 'Se adelanta un poco · desregulado', short: 'Regular', calibers: ['auto'],
    symptom: '"Se adelanta casi 40 segundos al día."',
    tg: { before: { rate: 38, amp: 291, be: 0.2, note: 'Amplitud sana y línea limpia, pero se <b>adelanta</b> 38 s/día: el reloj solo está <b>desregulado</b>.' } },
    steps: [
      { tool: 'screwdriver', anySize: true, on: 'regulator', part: 'balance', need: 'in', fx: 'regulate', title: 'Mueve la raqueta con el destornillador más fino', msg: '✅ Raqueta movida un poco hacia «−» (más lento). Compruébalo con el timegrapher.' }
    ],
    lessons: ['Si la amplitud y el error de marcha están bien, basta con regular la raqueta.', 'Se regula con el fondo abierto y el reloj en el timegrapher, en pasos muy pequeños.']
  },
  bateria: {
    id: 'bateria', name: 'No funciona · pila agotada', short: 'Pila', calibers: ['quartz'],
    symptom: '"Se paró de repente."',
    tg: { before: null }, meter: { battery: '1,21 V (agotada; nueva: 1,55 V)', coil: '1,9 kΩ (bien)' },
    steps: [
      { tool: 'meter', on: 'battery', part: 'battery', need: 'in', fx: 'reveal', title: 'Mide la pila con el multímetro', msg: '🔋 <b>1,21 V</b>: la pila SR626SW está <b>agotada</b> (nueva: 1,55 V). Sácala y cámbiala en <b>Piezas</b>.' },
      { replace: 'battery', title: 'Cambia la pila por una nueva', msg: '✅ Pila <b>nueva</b> SR626SW (1,55 V) en la bandeja. Móntala con las pinzas de plástico.' }
    ],
    lessons: ['En cuarzo se mide antes de cambiar nada: pila por debajo de ~1,4 V = agotada.', 'La pila agotada no se recarga: se saca y se pone una nueva del cajón (botón Piezas).', 'La pila se toca con pinzas de plástico para no hacer cortocircuito.']
  },
  bobina: {
    id: 'bobina', name: 'Pila nueva y sigue parado · bobina cortada', short: 'Bobina', calibers: ['quartz'],
    symptom: '"Le cambiaron la pila en un kiosco y sigue parado."',
    tg: { before: null }, meter: { battery: '1,56 V (bien)', coil: '∞ Ω · circuito abierto (sana: ≈ 1,9 kΩ)' },
    steps: [
      { tool: 'meter', on: 'battery', part: 'battery', need: 'in', title: 'Mide la pila', msg: '🔋 1,56 V: la pila está bien. El problema está en otro sitio.' },
      { tool: 'meter', on: 'coil', part: 'coil', need: 'in', fx: 'reveal', title: 'Mide la bobina', msg: '🧵 <b>∞ Ω</b>: la bobina está <b>cortada</b> (sana ≈ 1,9 kΩ). Hay que cambiarla.' },
      { replace: 'coil', title: 'Cambia la bobina cortada', msg: '✅ Bobina <b>nueva</b> (≈ 1,9 kΩ) en la bandeja. Vuelve a montarla y después la pila.' }
    ],
    lessons: ['Si la pila está bien y no hay impulsos, se mide la bobina: circuito abierto = bobina cortada.', 'Antes de tocar el circuito se quita la pila.']
  },
  humedad: {
    id: 'humedad', name: 'Agua dentro', short: 'Agua', calibers: ['mesa'],
    symptom: '"Se paró después del mar."',
    tg: { before: null },
    steps: [],
    lessons: ['El agua se ve en el cristal empañado y en el verdín. No vuelve con cuerda ni con una pila nueva.']
  },
  sinFalla: {
    id: 'sinFalla', name: 'Sin falla · desarme libre', short: 'Libre', calibers: ['auto', 'quartz', 'tourbillon'], free: true,
    symptom: 'Práctica libre: desarma todo lo que quieras y vuelve a montarlo.',
    tg: { before: { rate: 2, amp: 288, be: 0.2, note: 'Reloj sano.' } },
    steps: [],
    lessons: ['Orden de desarme = inverso del orden de montaje del fabricante.', 'Cada tornillo con su punta; cada pieza con su lubricante.']
  }
};
export const TG_OK = { auto: { rate: 2, amp: 286, be: 0.2, note: 'Línea casi plana: <b>+2 s/día</b> con amplitud sana. ¡Listo para el cliente!' }, quartz: { quartz: true, rate: 0.3, note: 'Impulsos cada segundo y marcha de <b>+0,3 s/día</b> en modo cuarzo. ¡Funciona!' } };
