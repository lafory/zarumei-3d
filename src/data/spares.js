// Piezas de servicio. Si el calibre la tiene, sale arriba en el cajón.
// types limita a ciertos calibres (el turbillón no usa un volante de serie).
export const SPARES = {
  battery: { spec: '1,55 V · nueva', why: 'Por debajo de 1,4 V está agotada. No se recarga: se tira y se pone esta.' },
  coil: { spec: '≈ 1,9 kΩ', why: 'Si el multímetro marca infinito, la bobina está cortada.' },
  balance: { spec: 'eje nuevo', why: 'Con el pivote roto se cambia el volante completo.', types: ['auto'] },
  barrel: { spec: 'muelle nuevo', why: 'El muelle fatigado no da amplitud. Este va dentro del barrilete.', types: ['auto', 'tourbillon'] }
};
export const SPARE_ORDER = ['battery', 'coil', 'balance', 'barrel'];
