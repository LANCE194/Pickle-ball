const { query } = require('../../../../config/db');
const booking = require('../../../../shared/services/booking');
const payment = require('../../../../shared/services/payment');
const qr = require('../../../../shared/services/qr');
const feature = require('../../../../shared/services/feature');
const notification = require('../../../../shared/services/notification');
const settings = require('../../../../shared/services/settings');
const tz = require('../../../../config/timezone');
const { HttpError } = require('../../../../shared/utils');
const me = async uid => { const { rows } = await query(`SELECT id, status FROM players WHERE user_id=$1 AND archived_at IS NULL`, [uid]); const p = rows[0]; if (!p) throw new HttpError(404, 'We could not find your player profile. Please ask the front desk.'); if (['suspended', 'inactive'].includes(p.status)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); return p; };
exports.slots = async ({ date, court }) => { const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : tz.manilaDate(new Date()); return { date: d, courts: await booking.slotGrid(d, court || null) }; };
exports.quote = async ({ court, start, hours }, user) => {
  const p = await me(user.id); const { rows } = await query('SELECT * FROM courts WHERE id=$1 AND archived_at IS NULL', [court]); if (!rows[0]) throw new HttpError(404, 'We could not find that court.');
  const s = new Date(start); const q = await booking.quote(rows[0], s, Number(hours) || 1, p.id); const cfg = await settings.getAll();
  return { ...q, total_label: tz.peso(q.total), schedule_line: tz.scheduleLine(s, new Date(s.getTime() + (Number(hours) || 1) * 3600000), rows[0]), cancellation_rule: `You can cancel up to ${cfg.cancellation_cutoff_hours} hours before your game.`, hold_rule: `Your time is held for ${cfg.booking_hold_minutes} minutes. Send payment proof to confirm.` };
};
// Remember the last court and length so the Home screen can offer "Book again".
exports.last = async user => { const p = await me(user.id); const { rows } = await query(`SELECT court_id, duration_hours, players_count FROM bookings WHERE player_id=$1 ORDER BY created_at DESC LIMIT 1`, [p.id]); return rows[0] || null; };
exports.book = async ({ court_id, start, hours, players_count }, user) => {
  const p = await me(user.id); const startsAt = new Date(start);
  const { booking: b, court, quote } = await booking.create({ courtId: court_id, playerId: p.id, startsAt, hours: Number(hours), playersCount: Number(players_count) || 2, bookedBy: user.id });
  const pay = await payment.createFor({ bookingId: b.id, playerId: p.id, amount: b.price });
  const cfg = await settings.getAll();
  await notification.notify(user.id, 'Booking received', `${tz.scheduleLine(b.starts_at, b.ends_at, court)}. Held for you for ${cfg.booking_hold_minutes} minutes. Send payment proof to confirm.`, 'booking');
  return { booking: booking.present({ ...b, court_name: court.name, court_number: court.court_number }), payment: { id: pay.id, reference_code: pay.reference_code, amount: pay.amount, amount_label: tz.peso(pay.amount) },
    qr_codes: (await feature.isEnabled('qr_payments')) ? await qr.list({ onlyEnabled: true }) : [], pay_at_court: await feature.isEnabled('pay_at_court'),
    message: `Held for you for ${cfg.booking_hold_minutes} minutes. Send payment proof to confirm.`, discount_percent: quote.discountPercent };
};
