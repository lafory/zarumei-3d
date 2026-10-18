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
  }
};
