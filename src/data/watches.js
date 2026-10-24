// RELOJES (data-driven): caja, esfera, agujas, brazalete y calibre. Todos son diseños propios ZARUMEI.
export const WATCHES = {
  miami: {
    id: 'miami', name: 'ZARUMEI Oro "Miami"', caliber: 'ZR28',
    blurb: 'Buceo de lujo en oro amarillo de 18 k, 40 mm, bisel grabado, esfera "Miami".',
    case: { style: 'diver', metal: 'gold', r: 20, bezel: 'engraved', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · AUTOMATIC · 28.800 A/h · WATER RESISTANT 100 M · ORO 18K · Nº 001 · ', backMono: 'Z' },
    dial: { kind: 'miami', r: 16.2, date: true }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'gold' },
    rotorText: 'ZARUMEI · MIAMI'
  },
  cuba: {
    id: 'cuba', name: 'ZARUMEI "Cuba Azul" Diver', caliber: 'ZR28',
    blurb: 'Buceo deportivo en acero 904L, 41 mm, bisel cerámico azul, esfera azul con el oso de la bandera.',
    case: { style: 'diver', metal: 'steel', r: 20.5, bezel: 'ceramicBlue', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · CUBA AZUL · AUTOMATIC · 200 M · ACERO 904L · Nº 002 · ', backMono: '★' },
    dial: { kind: 'cuba', r: 16.2, date: true }, hands: { style: 'baton', metal: 'steel' }, bracelet: { style: 'oyster', metal: 'steel' },
    rotorText: 'ZARUMEI · CUBA AZUL'
  },
  rose: {
    id: 'rose', name: 'ZARUMEI Rosé Slim', caliber: 'ZQ11',
    blurb: 'Reloj de vestir extraplano, 38 mm, acero con baño de oro rosa, esfera blanca y brazalete de eslabones.',
    case: { style: 'slim', metal: 'rose', r: 19, bezel: 'polished', crownGuards: false, caseback: 'snap', backText: 'ZARUMEI · QUARTZ · STAINLESS STEEL · IP ROSE GOLD · 3 ATM · ', backMono: 'Z' },
    dial: { kind: 'rose', r: 15.6, date: false }, hands: { style: 'leaf', metal: 'rose' }, bracelet: { style: 'multilink', metal: 'rose' }
  },
  astralMiami: {
    id: 'astralMiami', name: 'ZARUMEI Astral «Miami»', caliber: 'ZT18',
    blurb: 'Turbillón de oro 18 k, nebulosa violeta, diamante y el oso Miami. Cuerda manual.',
    case: { style: 'astral', metal: 'gold', r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · TOURBILLON · ZT-18 · 18 RUBIS · ORO 18K · ASTRAL MIAMI · Nº 018 · ', backMono: 'Z' },
    dial: { kind: 'astral', r: 12.2, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold' },
    astral: { sky: 'purple', bear: 'miami', layout: { time: [0, -7.6], bear: [7.05, 1.25], diamond: [-7.15, 2.25], balance: [0.15, 4.55] } }
  },
  astralCuba: {
    id: 'astralCuba', name: 'ZARUMEI Astral «Cuba»', caliber: 'ZT18',
    blurb: 'Turbillón de oro, cielo azul, jaula de volante, diamante y el oso Cuba.',
    case: { style: 'astral', metal: 'gold', r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · TOURBILLON · ZT-18 · 18 RUBIS · ORO 18K · ASTRAL CUBA · Nº 019 · ', backMono: '★' },
    dial: { kind: 'astral', r: 12.2, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold' },
    astral: { sky: 'blue', bear: 'cuba', layout: { time: [0, -7.5], bear: [7.15, 1.55], diamond: [-6.5, 4.85], balance: [-6.7, -2.7] } }
  },
  diablo: {
    id: 'diablo', name: 'ZARUMEI Diablo Rojo', caliber: 'ZC40', grand: { emblem: 'diablo' },
    blurb: 'Cronógrafo mecánico de laca roja. Día, mes y profundímetro de membrana. Máscara del diablo.',
    case: { style: 'chrono', metal: 'gold', lacquer: 0x8c1422, pusher: 'orb', r: 21, bezel: 'polished', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-40 · CHRONOGRAPHE · JOUR · MOIS · PROFONDEUR · 100 M · Nº 040 · ', backMono: 'D' },
    dial: { kind: 'diablo', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold' },
    rotorText: 'ZARUMEI · DIABLO'
  },
  espina: {
    id: 'espina', name: 'ZARUMEI Espina', caliber: 'ZC41', grand: { emblem: 'espina', compass: true },
    blurb: 'El mismo calibre, bisel de púas de oro y una brújula mecánica sobre la esfera, a las 12.',
    case: { style: 'chrono', metal: 'gold', spikes: true, r: 21, bezel: 'engraved', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-41 · CHRONOGRAPHE · BOUSSOLE · 100 M · OR 18K · Nº 041 · ', backMono: 'E' },
    dial: { kind: 'espina', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'gold' },
    rotorText: 'ZARUMEI · ESPINA'
  },
  ala: {
    id: 'ala', name: 'ZARUMEI Ala de Fuego', caliber: 'ZC42', grand: { emblem: 'ala', compass: true, military: true },
    blurb: 'Alas de oro y esmalte magenta, brújula y aguja de hora militar de 24 horas.',
    case: { style: 'chrono', metal: 'gold', r: 21, bezel: 'engraved', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-42 · 24H · BOUSSOLE · CHRONOGRAPHE · OR 18K · Nº 042 · ', backMono: 'A' },
    dial: { kind: 'ala', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'gold' },
    rotorText: 'ZARUMEI · ALA'
  },
  orbital: {
    id: 'orbital', name: 'ZARUMEI Orbital', caliber: 'ZC43', grand: { emblem: 'orbital', compass: true, military: true, moon: true },
    blurb: 'Jaula calada de acero y oro, esfera verde y fases de la luna. Lleva todas las complicaciones.',
    case: { style: 'chrono', metal: 'steel', r: 21, bezel: 'polished', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-43 · LUNE · 24H · BOUSSOLE · CHRONOGRAPHE · ACIER · Nº 043 · ', backMono: 'O' },
    dial: { kind: 'orbital', r: 16.2, date: false }, hands: { style: 'baton', metal: 'steel' }, bracelet: { style: 'oyster', metal: 'steel' },
    rotorText: 'ZARUMEI · ORBITAL'
  },
  ancla: {
    id: 'ancla', name: 'ZARUMEI Ancla', caliber: 'ZR28', maison: true,
    blurb: 'Oro 18 k y azul marino. Bisel cerámico, esfera sol y ancla. Mismos tornillos que el Miami: calibre ZR-28.',
    case: { style: 'diver', metal: 'gold', r: 20, bezel: 'ceramicBlue', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ANCLA · AUTOMATIC · 28.800 A/h · 100 M · ORO 18K · Nº 050 · ', backMono: 'A' },
    dial: { kind: 'ancla', r: 16.2, date: true }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'gold' },
    rotorText: 'ZARUMEI · ANCLA'
  },
  octava: {
    id: 'octava', name: 'ZARUMEI Octava', caliber: 'ZR28', maison: true,
    blurb: 'Bisel de ocho lados, ocho tornillos de caja y brazalete integrado. El movimiento es el ZR-28, tornillo por tornillo.',
    case: { style: 'octagon', metal: 'steel', r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · OCTAVA · AUTOMATIC · 28.800 A/h · ACERO · Nº 051 · ', backMono: '8' },
    dial: { kind: 'octava', r: 15.2, date: true }, hands: { style: 'baton', metal: 'steel' }, bracelet: { style: 'oyster', metal: 'steel' },
    rotorText: 'ZARUMEI · OCTAVA'
  },
  lira: {
    id: 'lira', name: 'ZARUMEI Lira', caliber: 'ZQ11', maison: true,
    blurb: 'Vestir extraplano en oro, esfera crema y agujas hoja. Mismos tornillos que el Rosé: cuarzo ZQ-11.',
    case: { style: 'slim', metal: 'gold', r: 19, bezel: 'polished', crownGuards: false, caseback: 'snap', backText: 'ZARUMEI · LIRA · QUARTZ · ORO 18K · 3 ATM · Nº 052 · ', backMono: 'L' },
    dial: { kind: 'lira', r: 15.4, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold' }
  },
  recta: {
    id: 'recta', name: 'ZARUMEI Recta', caliber: 'ZR28', maison: true,
    blurb: 'Caja rectángulo de oro, romanos, luna, día, mes, año y la hora de la Ciudad del Vaticano. Mecánico, sin pila. Mismos tornillos que el Miami: ZR-28.',
    case: { style: 'tank', metal: 'gold', r: 20, bezel: 'polished', crownGuards: false, caseback: 'snap', backText: 'ZARUMEI · RECTA · MECANIQUE · SANS PILE · LUNE · GMT VATICAN · ORO 18K · Nº 053 · ', backMono: 'R' },
    dial: { kind: 'recta', r: 7.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold' },
    rotorText: 'ZARUMEI · RECTA'
  },
  nacar: {
    id: 'nacar', name: 'ZARUMEI Nácar', caliber: 'ZX60', opera: true, habana: 'nacre',
    blurb: 'Buceo de acero, bisel de cerámica negra y nácar calado. Turbillón, oso Cuba, diamante, palma, colibrí, abeja y el Morro.',
    case: { style: 'diver', metal: 'steel', r: 20.5, bezel: 'ceramicBlack', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · NACAR · ZX-60 · TOURBILLON · MINUTE REPEATER · 60 PIECES · ACIER · Nº 060 · ', backMono: 'N' },
    dial: { kind: 'habana', r: 13.6, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'steel' }
  },
  noche: {
    id: 'noche', name: 'ZARUMEI Noche', caliber: 'ZX60', opera: true, habana: 'stars',
    blurb: 'Oro 18 k, cielo estrellado y correa de aligátor azul marino. El mismo ZX-60, el movimiento más largo del taller.',
    case: { style: 'astral', metal: 'gold', r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · NOCHE · ZX-60 · TOURBILLON · MINUTE REPEATER · 60 PIECES · ORO 18K · Nº 061 · ', backMono: 'H' },
    dial: { kind: 'habana', r: 13.6, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold', dye: 0x1a3f86 }
  },
  verano: {
    id: 'verano', name: 'ZARUMEI Verano', caliber: 'ZX60', opera: true, habana: 'tropic',
    blurb: 'El mismo buceo de cerámica negra, con la esfera pintada: palmas, mar y el Morro, y encima el calibre calado.',
    case: { style: 'diver', metal: 'steel', r: 20.5, bezel: 'ceramicBlack', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · VERANO · ZX-60 · TOURBILLON · MINUTE REPEATER · 60 PIECES · ACIER · Nº 062 · ', backMono: 'V' },
    dial: { kind: 'habana', r: 13.6, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'oyster', metal: 'steel' }
  },
  fiesta: {
    id: 'fiesta', name: 'ZARUMEI Fiesta', caliber: 'ZC44', grand: { emblem: 'placa', rim: true },
    blurb: 'Cronógrafo de rueda de columnas. Día, mes y profundímetro. Sin pila. Oso, puro y ron.',
    case: { style: 'chrono', metal: 'gold', r: 21, bezel: 'stars', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-44 · CHRONOGRAPHE · JOUR · MOIS · PROFONDEUR · SANS PILE · Nº 070 · ', backMono: 'F' },
    dial: { kind: 'fiesta', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'nato', metal: 'gold', stripes: ['#1aa3a8', '#f2d24b', '#e23b2f', '#1f8a3a'] },
    rotorText: 'ZARUMEI · FIESTA'
  },
  cosmos: {
    id: 'cosmos', name: 'ZARUMEI Cosmos', caliber: 'ZC45', grand: { emblem: 'placa', rim: true, cam: true, compass: true },
    blurb: 'Cronógrafo de leva y brújula. Ruedas azuladas, día y mes. Sin profundímetro ni pila.',
    case: { style: 'chrono', metal: 'steel', r: 21, bezel: 'splash', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-45 · LEVA · JOUR · MOIS · BOUSSOLE · SANS PILE · Nº 071 · ', backMono: 'C' },
    dial: { kind: 'cosmos', r: 16.2, date: false }, hands: { style: 'baton', metal: 'steel' }, bracelet: { style: 'resin', metal: 'steel' },
    rotorText: 'ZARUMEI · COSMOS'
  },
  hoja: {
    id: 'hoja', name: 'ZARUMEI Hoja', caliber: 'ZC46', grand: { emblem: 'placa', rim: true, luna: true, moon: true, military: true },
    blurb: 'Cronógrafo en oro rosa, con luna y hora de 24 h. Día y mes. Sin pila.',
    case: { style: 'chrono', metal: 'steel', crown: 'gold', r: 21, bezel: 'wreath', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-46 · LUNE · 24H · JOUR · MOIS · OR ROSE · SANS PILE · Nº 072 · ', backMono: 'H' },
    dial: { kind: 'hoja', r: 16.2, date: false }, hands: { style: 'leaf', metal: 'gold' }, bracelet: { style: 'alligator', metal: 'gold', dye: 0x1a1a1c, leaves: true },
    rotorText: 'ZARUMEI · HOJA'
  },
  marte: {
    id: 'marte', name: 'ZARUMEI Marte', caliber: 'ZC45', grand: { emblem: 'placa', rim: true, cam: true, compass: true },
    blurb: 'El mismo calibre de leva que el Cosmos: brújula, día y mes. Sin pila.',
    case: { style: 'chrono', metal: 'steel', r: 21, bezel: 'engraved', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-45 · LEVA · JOUR · MOIS · BOUSSOLE · SANS PILE · Nº 073 · ', backMono: 'M' },
    dial: { kind: 'marte', r: 16.2, date: false }, hands: { style: 'sword', metal: 'steel' }, bracelet: { style: 'suede', metal: 'steel' },
    rotorText: 'ZARUMEI · MARTE'
  },
  mascara: {
    id: 'mascara', name: 'ZARUMEI Máscara', caliber: 'ZC44', grand: { emblem: 'placa', rim: true },
    blurb: 'Caja negra y correa partida. El ZC-44 de columnas, día, mes y profundímetro.',
    case: { style: 'chrono', metal: 'steel', lacquer: 0x1a1a1c, r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · ZC-44 · CHRONOGRAPHE · JOUR · MOIS · PROFONDEUR · SANS PILE · Nº 074 · ', backMono: 'K' },
    dial: { kind: 'mascara', r: 16.2, date: false }, hands: { style: 'baton', metal: 'steel' }, bracelet: { style: 'split', metal: 'steel' },
    rotorText: 'ZARUMEI · MÁSCARA'
  },
  cuerno: {
    id: 'cuerno', name: 'ZARUMEI Cuerno', caliber: 'ZC44', grand: { emblem: 'placa', rim: true },
    blurb: 'Laca negra, anillo de oro y costura roja. Mismo ZC-44 de columnas.',
    case: { style: 'chrono', metal: 'gold', lacquer: 0x141414, ring: 'gold', r: 21, bezel: 'polished', crownGuards: false, caseback: 'screw', backText: 'ZARUMEI · ZC-44 · CHRONOGRAPHE · JOUR · MOIS · PROFONDEUR · SANS PILE · Nº 075 · ', backMono: 'Q' },
    dial: { kind: 'cuerno', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'stitch', metal: 'gold', stitch: 0xc41212 },
    rotorText: 'ZARUMEI · CUERNO'
  },
  onelove: {
    id: 'onelove', name: 'ZARUMEI One Love', caliber: 'ZC46', grand: { emblem: 'placa', rim: true, luna: true, moon: true, military: true },
    blurb: 'El calibre de la Hoja: oro rosa, luna y 24 h. Día y mes. Sin pila.',
    case: { style: 'chrono', metal: 'gold', lacquer: 0x141416, r: 21, bezel: 'leaves', crownGuards: true, caseback: 'screw', backText: 'ZARUMEI · ZC-46 · LUNE · 24H · JOUR · MOIS · OR ROSE · SANS PILE · Nº 076 · ', backMono: 'Z' },
    dial: { kind: 'onelove', r: 16.2, date: false }, hands: { style: 'sword', metal: 'gold' }, bracelet: { style: 'weave', metal: 'gold' },
    rotorText: 'ZARUMEI · ONE LOVE'
  }
};
