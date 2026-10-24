// Hora civil de la Ciudad del Vaticano (Europe/Vatican, si no existe Europe/Rome)
// y fase de la luna. La hora local del taller sigue en las agujas de oro.
const SYNODIC = 29.530588853;
const KNOWN_NEW = Date.UTC(2000, 0, 6, 18, 14);
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function zoneFormat(d) {
  const opt = { hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  try { return new Intl.DateTimeFormat('en-GB', { ...opt, timeZone: 'Europe/Vatican' }); }
  catch (e) { return new Intl.DateTimeFormat('en-GB', { ...opt, timeZone: 'Europe/Rome' }); }
}

export function vaticanNow(d = new Date()) {
  const parts = Object.fromEntries(zoneFormat(d).formatToParts(d).map(p => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  let phase = ((d.getTime() - KNOWN_NEW) / 86400000) / SYNODIC;
  phase -= Math.floor(phase);
  return {
    h24: hour + minute / 60 + second / 3600,
    dow: DOW[parts.weekday] ?? 0,
    month: Number(parts.month) - 1,
    year: Number(parts.year),
    phase
  };
}
