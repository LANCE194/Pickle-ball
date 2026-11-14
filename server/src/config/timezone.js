// All times are stored in UTC and shown in Asia/Manila (UTC+8, no daylight saving).
const TZ = 'Asia/Manila';
const OFFSET_MIN = 8 * 60;
const fmt = (d, o) => new Intl.DateTimeFormat('en-PH', { timeZone: TZ, ...o }).format(new Date(d));
const parts = d => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(d)).map(p => [p.type, p.value]));
/** Build a UTC Date from a Manila wall-clock date (YYYY-MM-DD) and time (HH:MM). */
function manilaToUtc(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number); const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MIN * 60000);
}
const manilaDate = d => { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; };
const manilaHour = d => Number(parts(d).hour) % 24;
const dayOfWeek = d => new Date(manilaToUtc(manilaDate(d)).getTime() + OFFSET_MIN * 60000).getUTCDay(); // 0 = Sunday
const formatDate = d => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(new Date(d)).map(x => [x.type, x.value])); return `${p.weekday}, ${p.day} ${p.month} ${p.year}`; }; // Sat, 14 Mar 2026
const formatTime = d => fmt(d, { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
const formatRange = (a, b) => `${formatTime(a)} - ${formatTime(b)}`;
const peso = n => `PHP ${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Schedule display rule (E): Date, Time, Court name and number. */
const scheduleLine = (start, end, court) => `${formatDate(start)}, ${formatRange(start, end)}, ${court.name} (Court ${court.court_number})`;
module.exports = { TZ, manilaToUtc, manilaDate, manilaHour, dayOfWeek, formatDate, formatTime, formatRange, peso, scheduleLine };
