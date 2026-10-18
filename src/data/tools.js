// Herramientas del banco LA FORY. `short` = etiqueta corta para la rejilla del móvil.
export const SCREWDRIVER_SIZES = [0.8, 1.0, 1.2, 1.4, 1.6]; // mm de punta (juego de destornilladores de relojero)

export const TOOLS = [
  { id: 'timegrapher', name: 'Timegrapher', short: 'Timegr.', desc: 'Escucha el tic-tac y mide la marcha (s/día), la amplitud (°) y el error de marcha (ms). En modo cuarzo mide los impulsos del motor.' },
  { id: 'compass', name: 'Brújula', desc: 'Si la aguja se mueve cerca del reloj, el reloj está magnetizado.' },
  { id: 'meter', name: 'Multímetro', short: 'Multím.', desc: 'Mide la tensión de la pila (V) y la resistencia de la bobina (Ω). Solo para cuarzo.' },
  { id: 'demag', name: 'Desmagnetizador', short: 'Desmag.', desc: 'Campo alterno que quita el magnetismo de las piezas de acero, sobre todo de la espiral.' },
  { id: 'caseWrench', name: 'Llave de fondo', short: 'Llave', desc: 'Llave tipo Jaxa: agarra las muescas de un fondo roscado sin rayarlo.' },
  { id: 'caseKnife', name: 'Cuchilla de fondo', short: 'Cuchilla', desc: 'Cuchilla para abrir fondos a presión (relojes finos y de cuarzo) por su muesca.' },
  { id: 'screwdriver', name: 'Destornillador', short: 'Destorn.', desc: 'Elige el tamaño de punta (0,8–1,6 mm) igual al de la ranura. Mantén pulsado o toca varias veces sobre el tornillo para girarlo.' },
  { id: 'tweezers', name: 'Pinzas', desc: 'Pinzas antimagnéticas: levantan y colocan puentes, ruedas, el volante y los resortes.' },
  { id: 'plasticTweezers', name: 'Pinzas plásticas', short: 'P. plást.', desc: 'Pinzas de plástico para la pila: no hacen cortocircuito ni la rayan.' },
  { id: 'holder', name: 'Soporte', desc: 'Soporte de movimiento: sujeta la máquina fuera de la caja, por el lado de los puentes o por el lado de la esfera.' },
  { id: 'loupe', name: 'Lupa', desc: 'Lupa de relojero x10: amplía la pieza que tocas para buscar aceite seco, ejes rotos o desgaste.' },
  { id: 'cleaner', name: 'Limpieza', desc: 'Rodico, palillo de madera y solvente de relojería para quitar el aceite viejo y la suciedad.' },
  { id: 'oiler', name: 'Aceitera', desc: 'Aceiteras finas con el lubricante correcto para cada punto: 9010 (rubíes), 9415 (paletas), 8217 (muelle real), grasa de silicona (junta).' },
  { id: 'dialProtector', name: 'Protector de esfera', short: 'Protector', desc: 'Lámina de plástico que se pone sobre la esfera antes de sacar o poner agujas.' },
  { id: 'handLevers', name: 'Palancas de agujas', short: 'Palancas', desc: 'Par de palancas para levantar las agujas (y el piñón de minutos) sin doblarlas.' },
  { id: 'handPress', name: 'Prensa de agujas', short: 'Prensa', desc: 'Prensa con punzones para clavar las agujas rectas en su eje: hora, minuto y segundero.' },
  { id: 'blower', name: 'Pera de aire', short: 'Pera', desc: 'Sopla el polvo sin tocar las piezas.' }
];
