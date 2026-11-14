const { query } = require('../../config/db');
const tz = require('../../config/timezone');
const membership = require('./membership');
const { DEFAULT_CLUB_ID } = require('./tenant');
function range(period, date) {
  const base = date || tz.manilaDate(new Date()); const start = tz.manilaToUtc(base, '00:00');
  const days = period === 'monthly' ? 30 : period === 'weekly' ? 7 : 1;
  const from = new Date(start.getTime() - (days - 1) * 86400000); const to = new Date(start.getTime() + 86400000);
  return { from, to, days, label: days === 1 ? tz.formatDate(start) : `${tz.formatDate(from)} - ${tz.formatDate(new Date(to.getTime() - 1))}` };
}
/** Counters for dashboards. `todayOnly` is used for the staff dashboard (no revenue). */
async function dashboard({ todayOnly = false, clubId = DEFAULT_CLUB_ID } = {}) {
  await require('./booking').expirePending(); await membership.refreshStatuses();
  const r = range('daily'); const m = range('monthly');
  const q1 = async (sql, p) => (await query(sql, p)).rows[0];
  const today = await q1(`SELECT count(*) FILTER (WHERE status IN ('pending','confirmed','completed'))::int AS bookings, count(*) FILTER (WHERE status='pending')::int AS pending FROM bookings WHERE starts_at >= $1 AND starts_at < $2 AND club_id=$3`, [r.from, r.to, clubId]);
  const pendingPay = await q1(`SELECT count(*)::int AS n FROM payments WHERE status IN ('pending_verification','pay_at_court_pending') AND club_id=$1`, [clubId]);
  const courts = await q1(`SELECT count(*)::int AS n FROM courts WHERE archived_at IS NULL AND status='available' AND club_id=$1`, [clubId]);
  const out = { today_bookings: today.bookings, pending_bookings: today.pending, pending_payments: pendingPay.n };
  const { rows: sched } = await query(`SELECT b.id, b.starts_at, b.ends_at, b.status, c.name AS court_name, c.court_number, p.first_name||' '||p.last_name AS player_name FROM bookings b JOIN courts c ON c.id=b.court_id AND c.club_id=b.club_id LEFT JOIN players p ON p.id=b.player_id AND p.club_id=b.club_id WHERE b.starts_at >= $1 AND b.starts_at < $2 AND b.status IN ('pending','confirmed','completed') AND b.club_id=$3 ORDER BY c.court_number, b.starts_at`, [r.from, r.to, clubId]);
  out.today_schedule = sched.map(s => ({ ...s, date_label: tz.formatDate(s.starts_at), time_label: tz.formatRange(s.starts_at, s.ends_at), court_label: `${s.court_name} (Court ${s.court_number})` }));
  const weekly = range('weekly');
  const { rows: bookingChart } = await query(`SELECT (starts_at AT TIME ZONE 'Asia/Manila')::date AS d, count(*)::int AS bookings FROM bookings WHERE club_id=$3 AND status IN ('pending','confirmed','completed') AND starts_at >= $1 AND starts_at < $2 GROUP BY 1 ORDER BY 1`, [weekly.from, weekly.to, clubId]);
  out.bookings_chart = bookingChart.map(c => ({ date: String(c.d).slice(0, 10), bookings: c.bookings }));
  if (todayOnly) return out;
  const rev = await q1(`SELECT COALESCE(sum(amount),0)::float AS n FROM payments WHERE status IN ('approved','paid_at_court') AND reviewed_at >= $1 AND reviewed_at < $2 AND club_id=$3`, [r.from, r.to, clubId]);
  const mrev = await q1(`SELECT COALESCE(sum(amount),0)::float AS n FROM payments WHERE status IN ('approved','paid_at_court') AND reviewed_at >= $1 AND reviewed_at < $2 AND club_id=$3`, [m.from, m.to, clubId]);
  const used = await q1(`SELECT COALESCE(sum(duration_hours),0)::int AS h FROM bookings WHERE status IN ('confirmed','completed') AND starts_at >= $1 AND starts_at < $2 AND club_id=$3`, [r.from, r.to, clubId]);
  const mins = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  const cap = (await query(`SELECT opens_at, closes_at FROM courts WHERE archived_at IS NULL AND status='available' AND club_id=$1`, [clubId])).rows.reduce((s, c) => s + (mins(c.closes_at) - mins(c.opens_at)) / 60, 0);
  const newMembers = await q1(`SELECT count(*)::int AS n FROM memberships WHERE created_at >= $1 AND club_id=$2`, [m.from, clubId]);
  out.revenue_today = rev.n; out.revenue_30d = mrev.n; out.utilization_percent = cap ? Math.round((used.h / cap) * 100) : 0; out.new_members_30d = newMembers.n; out.active_courts = courts.n;
  const { rows: ch } = await query(`SELECT (p.reviewed_at AT TIME ZONE 'Asia/Manila')::date AS d, sum(p.amount)::float AS revenue FROM payments p WHERE p.status IN ('approved','paid_at_court') AND p.reviewed_at >= $1 AND p.club_id=$2 GROUP BY 1 ORDER BY 1`, [new Date(Date.now() - 13 * 86400000), clubId]);
  out.revenue_chart = ch.map(c => ({ date: String(c.d).slice(0, 10), revenue: c.revenue }));
  const { rows: ut } = await query(`SELECT (starts_at AT TIME ZONE 'Asia/Manila')::date AS d, sum(duration_hours)::int AS hours FROM bookings WHERE status IN ('confirmed','completed') AND starts_at >= $1 AND club_id=$2 GROUP BY 1 ORDER BY 1`, [new Date(Date.now() - 13 * 86400000), clubId]);
  out.utilization_chart = ut.map(c => ({ date: String(c.d).slice(0, 10), hours: c.hours }));
  return out;
}
async function report(period, date, clubId = DEFAULT_CLUB_ID) {
  const r = range(period, date);
  const { rows: bookings } = await query(`SELECT b.starts_at, b.ends_at, b.status, b.price, c.name AS court_name, c.court_number, COALESCE(p.first_name||' '||p.last_name,'Walk-in') AS player FROM bookings b JOIN courts c ON c.id=b.court_id AND c.club_id=b.club_id LEFT JOIN players p ON p.id=b.player_id AND p.club_id=b.club_id WHERE b.starts_at >= $1 AND b.starts_at < $2 AND b.club_id=$3 ORDER BY b.starts_at`, [r.from, r.to, clubId]);
  const { rows: pays } = await query(`SELECT status, count(*)::int AS n, COALESCE(sum(amount),0)::float AS total FROM payments WHERE created_at >= $1 AND created_at < $2 AND club_id=$3 GROUP BY status`, [r.from, r.to, clubId]);
  const revenue = pays.filter(p => ['approved', 'paid_at_court'].includes(p.status)).reduce((s, p) => s + p.total, 0);
  return { period, label: r.label, revenue, payments: pays, bookings: bookings.map(b => ({ ...b, date_label: tz.formatDate(b.starts_at), time_label: tz.formatRange(b.starts_at, b.ends_at), court_label: `${b.court_name} (Court ${b.court_number})`, price_label: tz.peso(b.price) })), totals: { bookings: bookings.length, confirmed: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length, cancelled: bookings.filter(b => ['cancelled', 'expired', 'no_show'].includes(b.status)).length } };
}
async function toXlsx(rep, title = 'DinkNest report') {
  const ExcelJS = require('exceljs'); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Bookings');
  ws.addRow([title, rep.label]); ws.addRow([]); ws.addRow(['Date', 'Time', 'Court', 'Player', 'Status', 'Price (PHP)']); ws.getRow(3).font = { bold: true };
  for (const b of rep.bookings) ws.addRow([b.date_label, b.time_label, b.court_label, b.player, b.status, Number(b.price)]);
  ws.addRow([]); ws.addRow(['Total revenue (PHP)', rep.revenue]); ws.columns.forEach(c => { c.width = 24; });
  return wb.xlsx.writeBuffer();
}
function toPdf(rep, title = 'DinkNest report') {
  const PDF = require('pdfkit'); const doc = new PDF({ margin: 40, size: 'A4' }); const chunks = [];
  doc.on('data', c => chunks.push(c)); const done = new Promise(res => doc.on('end', () => res(Buffer.concat(chunks))));
  doc.fontSize(20).text(title); doc.fontSize(11).fillColor('#5B6B7A').text(rep.label).moveDown();
  doc.fillColor('#0B1F3A').fontSize(12).text(`Bookings: ${rep.totals.bookings}   Confirmed: ${rep.totals.confirmed}   Cancelled: ${rep.totals.cancelled}   Revenue: ${tz.peso(rep.revenue)}`).moveDown();
  for (const b of rep.bookings.slice(0, 400)) { doc.fontSize(9).text(`${b.date_label}  |  ${b.time_label}  |  ${b.court_label}  |  ${b.player}  |  ${b.status}  |  ${b.price_label}`); if (doc.y > 760) doc.addPage(); }
  doc.end(); return done;
}
async function attendanceXlsx(rows) {
  const ExcelJS = require('exceljs'); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Attendance');
  ws.addRow(['Date', 'Time', 'Player', 'Court', 'Method']); ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow([r.date_label, r.time_label, `${r.first_name} ${r.last_name}`, r.court_name ? `${r.court_name} (Court ${r.court_number})` : '', r.method]);
  ws.columns.forEach(c => { c.width = 24; }); return wb.xlsx.writeBuffer();
}
function bracketPdf(t, matches) {
  const PDF = require('pdfkit'); const doc = new PDF({ margin: 40, size: 'A4', layout: 'landscape' }); const chunks = []; doc.on('data', c => chunks.push(c)); const done = new Promise(res => doc.on('end', () => res(Buffer.concat(chunks))));
  doc.fontSize(20).text(t.name); doc.fontSize(11).fillColor('#5B6B7A').text(`${t.starts_label} - ${t.ends_label}  |  ${t.format.replace(/_/g, ' ')}  |  ${t.category}`).moveDown(); doc.fillColor('#0B1F3A');
  let last = ''; for (const m of matches) { const key = `${m.bracket} round ${m.round}${m.pool ? ' pool ' + m.pool : ''}`; if (key !== last) { last = key; doc.moveDown(0.5).fontSize(13).text(key.toUpperCase()); }
    doc.fontSize(10).text(`${m.side_a || 'TBD'}  vs  ${m.side_b || 'TBD'}   ${m.date_label ? `[${m.date_label}, ${m.time_label}, ${m.court_label}]` : ''}  ${m.status === 'completed' && m.games ? m.games.map(g => `${g.a}-${g.b}`).join(', ') : ''}`); if (doc.y > 540) doc.addPage(); }
  doc.end(); return done;
}
module.exports = { dashboard, report, toXlsx, toPdf, attendanceXlsx, bracketPdf, range };
