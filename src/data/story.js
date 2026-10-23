// MODO HISTORIA: órdenes de trabajo del taller LA FORY. Cada caso = reloj + falla + diagnóstico obligatorio.
export const STORY = [
  { id: 'c1', watch: 'miami', fault: 'aceiteSeco', title: 'Caso 1 · "Se atrasa"', cliente: 'Sr. Díaz — Miami, FL',
    diag: ['timegrapher', 'compass'], intro: 'El cliente dice que <b>se atrasa</b>. Mide primero, descarta el magnetismo y luego abre.' },
  { id: 'c2', watch: 'cuba', fault: 'magnetizado', title: 'Caso 2 · "Se adelanta muchísimo"', cliente: 'Yamilé R. — Hialeah, FL',
    diag: ['timegrapher', 'compass'], intro: 'Se adelanta minutos al día. ¿Qué dice la brújula?' },
  { id: 'c3', watch: 'rose', fault: 'bateria', title: 'Caso 3 · "No funciona"', cliente: 'Laura M. — Coral Gables, FL',
    diag: ['timegrapher'], intro: 'Un cuarzo parado. Mide la pila. Si está agotada, sácala y pon una nueva en <b>Piezas</b>.' },
  { id: 'c4', watch: 'cuba', fault: 'ejeRoto', title: 'Caso 4 · "Se me cayó"', cliente: 'Andy P. — Little Havana, FL',
    diag: ['timegrapher'], intro: 'Se cayó al suelo y ya no late. Hay que llegar al volante.' },
  { id: 'c5', watch: 'miami', fault: 'muelleDebil', title: 'Caso 5 · "Se para por la noche"', cliente: 'Sr. Díaz — Miami, FL (otra vez)',
    diag: ['timegrapher'], intro: 'Amplitud baja y se para. Esta vez hay que desarmar hasta el barrilete.' },
  { id: 'c6', watch: 'rose', fault: 'bobina', title: 'Caso 6 · "Pila nueva y sigue parado"', cliente: 'Laura M. — Coral Gables, FL',
    diag: ['timegrapher'], intro: 'Ya le cambiaron la pila y no anda. Mide la pila y después la bobina.' },
  { id: 'c7', watch: 'miami', fault: 'desregulado', title: 'Caso 7 · "Se adelanta un poco"', cliente: 'Club de buceo Key Biscayne',
    diag: ['timegrapher', 'compass'], intro: 'Solo se adelanta 38 s/día. ¿Hace falta desarmar?' }
];
