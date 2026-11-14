// Booking operations used by the Admin and Staff bookings screens (each role keeps its own feature folder and permission rules).
const { query } = require('../../config/db');
const booking = require('./booking');
const payment = require('./payment');
const tz = require('../../config/timezone');
const { HttpError, cleanText } = require('../utils');
async function list({ date, court = '', status = '', q = '', range = 'day' } = {}) {
  await booking.expirePending();
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : tz.manilaDate(new Date());
  const from = tz.manilaToUtc(d, '00:00'); const days = range === 'month' ? 31 : range === 'week' ? 7 : 1; const to = new Date(from.getTime() + days * 86400000);
  const { rows } = await query(`${booking.SELECT_VIEW} WHERE b.starts_at >= $1 AND b.starts_at < $2 AND ($3='' OR b.court_id::text=$3) AND ($4='' OR b.status::text=$4) AND ($5='' OR lower(coalesce(p.first_name||' '||p.last_name,'') || ' ' || coalesce(b.notes,'')) LIKE '%'||lower($5)||'%') ORDER BY b.starts_at, c.court_number`, [from, to, court, status, q]);
  return { date: d, range, bookings: rows.map(booking.present) };
}
/** Walk-in: confirmed at once; the payment waits for staff to mark "paid at the court". */
async function walkIn({ court_id, player_id, start, hours, guest_name, players_count }, user) {
  const e = {}; if (!court_id) e.court_id = 'Choose a court.'; if (!start) e.start = 'Choose a time.'; if (!player_id && !guest_name) e.guest_name = 'Pick a player or type the guest name.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
  const r = await booking.create({ courtId: court_id, playerId: player_id || null, startsAt: new Date(start), hours: Number(hours) || 1, playersCount: Number(players_count) || 2, bookedBy: user.id, walkIn: true, status: 'confirmed', notes: guest_name ? `Walk-in: ${cleanText(guest_name, 60)}` : 'Walk-in' });
  let pay = null; if (player_id) { pay = await payment.createFor({ bookingId: r.booking.id, playerId: player_id, amount: r.booking.price }); await query(`UPDATE payments SET status='pay_at_court_pending' WHERE id=$1`, [pay.id]); }
  return { booking: booking.present({ ...r.booking, court_name: r.court.name, court_number: r.court.court_number }), payment_id: pay && pay.id };
}
async function recurring({ court_id, player_id, start, hours, weeks }, user) {
  const w = Math.min(Math.max(Number(weeks) || 4, 2), 26);
  const r = await booking.createRecurring({ courtId: court_id, playerId: player_id || null, startsAt: new Date(start), hours: Number(hours) || 1, weeks: w, bookedBy: user.id });
  return { created: r.made.length, skipped: r.skipped, message: `${r.made.length} weekly bookings created${r.skipped.length ? `, ${r.skipped.length} skipped because the court was not free` : ''}.` };
}
module.exports = { list, walkIn, recurring };
