const TZ = 'Asia/Manila';
const d = v => new Date(v);
export const fmtDate = v => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(d(v)).map(x => [x.type, x.value])); return `${p.weekday}, ${p.day} ${p.month} ${p.year}`; }; // Sat, 14 Mar 2026
export const fmtTime = v => d(v).toLocaleTimeString('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
export const fmtRange = (a, b) => `${fmtTime(a)} - ${fmtTime(b)}`;
export const peso = n => `PHP ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const todayManila = () => d(new Date()).toLocaleDateString('en-CA', { timeZone: TZ });
export const addDays = (ymd, n) => { const t = new Date(`${ymd}T00:00:00+08:00`); t.setDate(t.getDate() + n); return t.toLocaleDateString('en-CA', { timeZone: TZ }); };
export const dayLabel = ymd => fmtDate(`${ymd}T00:00:00+08:00`);
/** 0917 123 4567 style while typing */
export const phMobile = v => { const x = String(v || '').replace(/\D/g, '').slice(0, 11); return [x.slice(0, 4), x.slice(4, 7), x.slice(7)].filter(Boolean).join(' '); };
export const courtLabel = (name, no) => `${name} (Court ${no})`;
