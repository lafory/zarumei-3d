// Catálogo de la boutique LA FORY (ficticio, moneda del juego). Datos puros: la vista 3D se genera desde `model`.
// model: { type: 'watch', watch } | { type: 'tool', tool } | { type: 'jewel', kind: ring|chain|pendant|earrings|tennis }
export const BOUTIQUE_CATS = [
  { id: 'relojes', name: 'Relojes', line: 'Colección LA FORY · Haute Horlogerie' },
  { id: 'herramientas', name: 'Herramientas', line: 'Colección LA FORY · Outils d’Atelier' },
  { id: 'joyeria', name: 'Joyería', line: 'Colección LA FORY · Haute Joaillerie' }
];
export const PRODUCTS = [
  { id: 'w-miami', cat: 'relojes', name: 'ZARUMEI Oro «Miami»', line: 'Diver 40 mm · oro amarillo 18 k', price: 24900, model: { type: 'watch', watch: 'miami' }, desc: 'Buceo de lujo con bisel grabado y esfera ilustrada «Miami». Calibre automático ZR-28.', specs: ['Oro amarillo 18 k', 'Calibre ZR-28 automático, 25 rubíes', 'Hermético 100 m', 'Brazalete Oyster de oro'] },
  { id: 'w-cuba', cat: 'relojes', name: 'ZARUMEI «Cuba Azul»', line: 'Diver 41 mm · acero 904L · cerámica', price: 13900, model: { type: 'watch', watch: 'cuba' }, desc: 'Buceo deportivo con bisel de cerámica azul y esfera de rayos de sol con el oso de la bandera.', specs: ['Acero 904L', 'Bisel cerámico azul', 'Calibre ZR-28 automático', 'Hermético 200 m'] },
  { id: 'w-rose', cat: 'relojes', name: 'ZARUMEI Rosé Slim', line: 'Vestir 38 mm · oro rosa · 6,9 mm', price: 8900, model: { type: 'watch', watch: 'rose' }, desc: 'Extraplano de vestir, esfera blanca laqueada, índices de bastón en oro rosa y brazalete de eslabones.', specs: ['Baño de oro rosa', 'Cuarzo ZQ-11 (tipo Ronda 762)', 'Grosor 6,9 mm', 'Brazalete multieslabón'] },
  { id: 't-drivers', cat: 'herramientas', name: 'Destornilladores Atelier', line: 'Juego de 5 · 0,8–1,6 mm', price: 1450, model: { type: 'tool', tool: 'screwdriver' }, desc: 'Mangos de latón moleteado con anillo de color por medida y cabeza giratoria. Puntas de acero templado.', specs: ['Puntas 0,8 · 1,0 · 1,2 · 1,4 · 1,6 mm', 'Latón y acero templado', 'Grabado LA FORY'] },
  { id: 't-tweezers', cat: 'herramientas', name: 'Pinzas N.º 3 Dumont-style', line: 'Acero antimagnético', price: 690, model: { type: 'tool', tool: 'tweezers' }, desc: 'Pinzas de precisión de punta fina para volantes, ruedas y espirales.', specs: ['Acero inoxidable antimagnético', 'Punta 0,1 mm'] },
  { id: 't-oiler', cat: 'herramientas', name: 'Aceitera de precisión', line: 'Juego de 3 puntas', price: 420, model: { type: 'tool', tool: 'oiler' }, desc: 'Deposita una gota exacta de 9010, 9415 u 8217.', specs: ['Puntas 0,10 · 0,16 · 0,25 mm'] },
  { id: 't-loupe', cat: 'herramientas', name: 'Lupa de relojero ×10', line: 'Óptica tallada', price: 380, model: { type: 'tool', tool: 'loupe' }, desc: 'Lupa de ojo con lente de cristal y montura de cuerno.', specs: ['×10 · Ø 25 mm'] },
  { id: 't-tg', cat: 'herramientas', name: 'Timegrapher LA FORY TG-1', line: 'Analizador de marcha', price: 3900, model: { type: 'tool', tool: 'timegrapher' }, desc: 'Mide marcha, amplitud y error de golpe en tiempo real.', specs: ['2,5 – 36.000 A/h', 'Micrófono de pinza', 'Pantalla de traza'] },
  { id: 'j-ring', cat: 'joyeria', name: 'Solitario «Étoile»', line: 'Oro amarillo 18 k · diamante 1,2 ct', price: 18500, model: { type: 'jewel', kind: 'ring' }, desc: 'Solitario de cuatro garras con brillante de talla redonda.', specs: ['Diamante 1,2 ct · color F · VS1', 'Oro amarillo 18 k'] },
  { id: 'j-chain', cat: 'joyeria', name: 'Cadena cubana «Malecón»', line: 'Oro 18 k · 8 mm', price: 12400, model: { type: 'jewel', kind: 'chain' }, desc: 'Eslabón cubano macizo pulido a espejo, cierre de seguridad.', specs: ['8 mm · 60 cm', 'Oro amarillo 18 k macizo'] },
  { id: 'j-pendant', cat: 'joyeria', name: 'Medallón Oso LA FORY', line: 'Oro 18 k · esmalte', price: 6900, model: { type: 'jewel', kind: 'pendant' }, desc: 'Medallón con el oso LA FORY esmaltado y bisel de diamantes.', specs: ['Ø 28 mm', 'Esmalte a fuego', '24 diamantes'] },
  { id: 'j-earrings', cat: 'joyeria', name: 'Pendientes «Lumière»', line: 'Oro blanco · 2 × 0,5 ct', price: 7800, model: { type: 'jewel', kind: 'earrings' }, desc: 'Botones de diamante en engaste de garras.', specs: ['2 × 0,5 ct', 'Oro blanco 18 k'] },
  { id: 'j-tennis', cat: 'joyeria', name: 'Pulsera Tennis «Rivière»', line: 'Oro rosa · 40 diamantes', price: 15600, model: { type: 'jewel', kind: 'tennis' }, desc: 'Riviera de 40 brillantes engastados en oro rosa.', specs: ['4 ct total', 'Oro rosa 18 k'] }
];
export const fmtPrice = (n) => '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
