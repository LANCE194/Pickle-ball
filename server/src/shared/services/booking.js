const { query, tx } = require('../../config/db');
const tz = require('../../config/timezone');
const settings = require('./settings');
const realtime = require('../../realtime/gateway');
const { HttpError } = require('../utils');
const notification = require('./notification');
const HOUR = 3600000;

function hhmm(t) { return String(t).slice(0, 5); }
/** Price per hour for one hour starting at `start` (peak / off-peak, weekend rule). */
function hourRate(court, start) {
  const dow = tz.dayOfWeek(start); const weekend = dow === 0 || dow === 6; const h = tz.manilaHour(start);
  const ps = Number(hhmm(court.peak_start).slice(0, 2)); const pe = Number(hhmm(court.peak_end).slice(0, 2));
  const peak = weekend ? court.weekend_all_day_peak : (h >= ps && h < pe);
  return Number(peak ? court.peak_rate : court.offpeak_rate);
}
async function memberDiscountPercent(playerId, db = null) {
  if (!playerId) return 0;
  const { rows } = await (db || { query }).query(`SELECT p.discount_percent FROM memberships m JOIN membership_plans p ON p.id=m.plan_id
    WHERE m.player_id=$1 AND m.status IN ('active','expiring') AND m.expires_on >= (now() AT TIME ZONE 'Asia/Manila')::date AND m.archived_at IS NULL ORDER BY p.discount_percent DESC LIMIT 1`, [playerId]);
  return rows[0] ? Number(rows[0].discount_percent) : 0;
}
async function quote(court, startsAt, hours, playerId, db) {
  let gross = 0; for (let i = 0; i < hours; i++) gross += hourRate(court, new Date(startsAt.getTime() + i * HOUR));
  const pct = await memberDiscountPercent(playerId, db);
  const discount = Math.round(gross * pct) / 100;
  return { gross, discount, total: gross - discount, discountPercent: pct };
}
/** Hourly slot grid for one date. Statuses: available | pending | confirmed | blocked | past. Public-safe (no personal data). */
async function slotGrid(date, courtId = null) {
  await expirePending();
  const dayStart = tz.manilaToUtc(date, '00:00'); const dayEnd = new Date(dayStart.getTime() + 24 * HOUR);
  const { rows: courts } = await query(`SELECT * FROM courts WHERE archived_at IS NULL ${courtId ? 'AND id=$1' : ''} ORDER BY court_number`, courtId ? [courtId] : []);
  const { rows: bks } = await query(`SELECT court_id, starts_at, ends_at, status FROM bookings WHERE status IN ('pending','confirmed','completed') AND starts_at < $2 AND ends_at > $1`, [dayStart, dayEnd]);
  const { rows: blocks } = await query(`SELECT court_id, starts_at, ends_at FROM court_blocks WHERE archived_at IS NULL AND starts_at < $2 AND ends_at > $1`, [dayStart, dayEnd]);
  const now = Date.now(); const out = [];
  for (const c of courts) {
    const slots = [];
    const open = Number(hhmm(c.opens_at).slice(0, 2)); const close = Number(hhmm(c.closes_at).slice(0, 2));
    for (let h = open; h < close; h++) {
      const s = tz.manilaToUtc(date, String(h).padStart(2, '0') + ':00'); const e = new Date(s.getTime() + HOUR);
      let status = 'available';
      if (c.status !== 'available') status = 'blocked';
      else if (blocks.some(b => b.court_id === c.id && b.starts_at < e && b.ends_at > s)) status = 'blocked';
      else { const b = bks.find(x => x.court_id === c.id && x.starts_at < e && x.ends_at > s); if (b) status = b.status === 'pending' ? 'pending' : 'confirmed'; }
      if (status === 'available' && s.getTime() <= now) status = 'past';
      slots.push({ start: s.toISOString(), end: e.toISOString(), label: `${tz.formatTime(s)} - ${tz.formatTime(e)}`, hour: h, status, rate: hourRate(c, s) });
    }
    out.push({ court: { id: c.id, name: c.name, court_number: c.court_number, type: c.type, status: c.status }, date, dateLabel: tz.formatDate(tz.manilaToUtc(date)), slots });
  }
  return out;
}
async function alternatives(courtId, startsAt, hours) {
  const date = tz.manilaDate(startsAt); const grid = await slotGrid(date); const alts = [];
  for (const g of grid) for (let i = 0; i + hours <= g.slots.length; i++) {
    if (g.slots.slice(i, i + hours).every(s => s.status === 'available')) alts.push({ court_id: g.court.id, court: `${g.court.name} (Court ${g.court.court_number})`, start: g.slots[i].start, label: `${tz.formatDate(g.slots[i].start)}, ${g.slots[i].label.split(' - ')[0]}` });
  }
  return alts.slice(0, 8);
}
/** Create a booking inside a transaction. The database exclusion constraint is the final guard against double-booking. */
async function create({ courtId, playerId = null, startsAt, hours, playersCount = 2, bookedBy, walkIn = false, status = 'pending', notes = null, recurringGroup = null, tournamentMatchId = null, openPlayPostId = null }, existingDb = null) {
  const cfg = await settings.getAll();
  if (!Number.isInteger(hours) || hours < cfg.min_booking_hours || hours > cfg.max_booking_hours) throw new HttpError(422, `Please choose between ${cfg.min_booking_hours} and ${cfg.max_booking_hours} hours.`, 'VALIDATION');
  if (Number.isNaN(startsAt.getTime())) throw new HttpError(422, 'Please choose a valid date and time.', 'VALIDATION');
  if (startsAt.getUTCMinutes() !== 0) throw new HttpError(422, 'Times start on the hour.', 'VALIDATION');
  if (!walkIn && !tournamentMatchId && startsAt.getTime() <= Date.now()) throw new HttpError(422, 'That time has already passed. Please pick a later time.', 'VALIDATION');
  const endsAt = new Date(startsAt.getTime() + hours * HOUR);
  const run = async db => {
    const { rows: cs } = await db.query('SELECT * FROM courts WHERE id=$1 AND archived_at IS NULL FOR SHARE', [courtId]);
    const court = cs[0]; if (!court) throw new HttpError(404, 'We could not find that court.');
    if (court.status !== 'available') throw new HttpError(409, `${court.name} is not open for booking right now.`, 'COURT_UNAVAILABLE');
    const openH = Number(hhmm(court.opens_at).slice(0, 2)), closeH = Number(hhmm(court.closes_at).slice(0, 2));
    const sh = tz.manilaHour(startsAt); const eh = tz.manilaHour(new Date(endsAt.getTime() - 1)) + 1;
    if (sh < openH || eh > closeH || tz.manilaDate(startsAt) !== tz.manilaDate(new Date(endsAt.getTime() - 1))) throw new HttpError(422, `${court.name} is open ${tz.formatTime(tz.manilaToUtc('2000-01-01', hhmm(court.opens_at)))} to ${tz.formatTime(tz.manilaToUtc('2000-01-01', hhmm(court.closes_at)))}. Please pick a time in that window.`, 'VALIDATION');
    const { rows: bl } = await db.query('SELECT 1 FROM court_blocks WHERE court_id=$1 AND archived_at IS NULL AND starts_at < $3 AND ends_at > $2 LIMIT 1', [courtId, startsAt, endsAt]);
    if (bl.length) throw new HttpError(409, 'That court is blocked at that time.', 'COURT_BLOCKED');
    const q = await quote(court, startsAt, hours, playerId, db);
    const expiresAt = status === 'pending' ? new Date(Date.now() + cfg.booking_hold_minutes * 60000) : null;
    try {
      const { rows } = await db.query(`INSERT INTO bookings (court_id, player_id, booked_by, starts_at, ends_at, duration_hours, players_count, status, price, discount, is_walk_in, recurring_group, expires_at, notes, tournament_match_id, open_play_post_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
        [courtId, playerId, bookedBy, startsAt, endsAt, hours, playersCount, status, q.total, q.discount, walkIn, recurringGroup, expiresAt, notes, tournamentMatchId, openPlayPostId]);
      return { booking: rows[0], court, quote: q };
    } catch (e) {
      if (e.code === '23P01') throw Object.assign(new HttpError(409, 'That time was just taken.', 'SLOT_TAKEN'), { alternatives: await alternatives(courtId, startsAt, hours) });
      throw e;
    }
  };
  const out = existingDb ? await run(existingDb) : await tx(run);
  realtime.publish('public:availability', 'availability.changed', { court_id: courtId, date: tz.manilaDate(startsAt) });
  realtime.publish('staffside', 'booking.changed', { id: out.booking.id });
  return out;
}
/** Weekly recurring bookings (staff/admin). Skips conflicting weeks and reports them. */
async function createRecurring({ courtId, playerId, startsAt, hours, weeks, bookedBy }) {
  const group = require('crypto').randomUUID(); const made = [], skipped = [];
  for (let i = 0; i < weeks; i++) {
    const s = new Date(startsAt.getTime() + i * 7 * 24 * HOUR);
    try { const r = await create({ courtId, playerId, startsAt: s, hours, bookedBy, walkIn: true, status: 'confirmed', recurringGroup: group }); made.push(r.booking); }
    catch (e) { if (e instanceof HttpError) skipped.push({ date: tz.formatDate(s), reason: e.message }); else throw e; }
  }
  return { group, made, skipped };
}
async function expirePending() {
  const { rows } = await query(`UPDATE bookings SET status='expired', updated_at=now() WHERE status='pending' AND expires_at IS NOT NULL AND expires_at < now() RETURNING id, court_id, starts_at`);
  await query(`UPDATE payments SET status='rejected', reject_reason='Booking hold expired', updated_at=now() WHERE status IN ('unpaid') AND booking_id = ANY($1)`, [rows.map(r => r.id)]);
  for (const r of rows) { realtime.publish('public:availability', 'availability.changed', { court_id: r.court_id, date: tz.manilaDate(r.starts_at) }); realtime.publish('staffside', 'booking.changed', { id: r.id }); }
  return rows.length;
}
/** Cancel. Players: own bookings, before the cutoff. Staff/admin: any booking, with a reason. */
async function cancel(id, user, reason) {
  const cfg = await settings.getAll();
  const { rows } = await query(`SELECT b.*, p.user_id AS player_user FROM bookings b LEFT JOIN players p ON p.id=b.player_id WHERE b.id=$1`, [id]);
  const b = rows[0]; if (!b) throw new HttpError(404, 'We could not find that booking.');
  if (['cancelled', 'expired', 'completed', 'no_show'].includes(b.status)) throw new HttpError(409, 'This booking can no longer be cancelled.');
  if (user.role === 'player') {
    if (b.player_user !== user.id) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
    const cutoff = new Date(b.starts_at).getTime() - cfg.cancellation_cutoff_hours * HOUR;
    if (Date.now() > cutoff) throw new HttpError(409, `You can cancel up to ${cfg.cancellation_cutoff_hours} hours before your game. Please contact the front desk.`, 'CUTOFF');
  } else if (!reason || !String(reason).trim()) throw new HttpError(422, 'Please tell us why you are cancelling.', 'VALIDATION');
  await query(`UPDATE bookings SET status='cancelled', cancel_reason=$2, cancelled_at=now(), updated_at=now() WHERE id=$1`, [id, reason || 'Cancelled by player']);
  await query(`UPDATE payments SET status = CASE WHEN status='approved' THEN status ELSE 'rejected' END, reject_reason = COALESCE(reject_reason,'Booking cancelled'), updated_at=now() WHERE booking_id=$1 AND status IN ('unpaid','pending_verification','pay_at_court_pending')`, [id]);
  realtime.publish('public:availability', 'availability.changed', { court_id: b.court_id, date: tz.manilaDate(b.starts_at) });
  realtime.publish('staffside', 'booking.changed', { id });
  if (user.role !== 'player' && b.player_user) await notification.notify(b.player_user, 'Your booking was cancelled', `${tz.formatDate(b.starts_at)}, ${tz.formatRange(b.starts_at, b.ends_at)}. Reason: ${reason}.`, 'booking');
  return b;
}
/** Move a booking (drag and drop) with a conflict check. */
async function move(id, { courtId, startsAt }) {
  return tx(async db => {
    const { rows } = await db.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE', [id]); const b = rows[0];
    if (!b) throw new HttpError(404, 'We could not find that booking.');
    if (!['pending', 'confirmed'].includes(b.status)) throw new HttpError(409, 'Only active bookings can be moved.');
    const ends = new Date(startsAt.getTime() + b.duration_hours * HOUR);
    const { rows: bl } = await db.query('SELECT 1 FROM court_blocks WHERE court_id=$1 AND archived_at IS NULL AND starts_at < $3 AND ends_at > $2 LIMIT 1', [courtId, startsAt, ends]);
    if (bl.length) throw new HttpError(409, 'That court is blocked at that time.', 'COURT_BLOCKED');
    try { await db.query('UPDATE bookings SET court_id=$2, starts_at=$3, ends_at=$4, updated_at=now() WHERE id=$1', [id, courtId, startsAt, ends]); }
    catch (e) { if (e.code === '23P01') throw Object.assign(new HttpError(409, 'That time is already taken.', 'SLOT_TAKEN'), { alternatives: await alternatives(courtId, startsAt, b.duration_hours) }); throw e; }
    realtime.publish('public:availability', 'availability.changed', {}); realtime.publish('staffside', 'booking.changed', { id });
    return { ...b, court_id: courtId, starts_at: startsAt, ends_at: ends };
  }).then(async moved => { // schedule change notice carries Date, Time and Court name/number
    const { rows } = await query(`SELECT p.user_id, c.name, c.court_number FROM bookings b JOIN courts c ON c.id=b.court_id LEFT JOIN players p ON p.id=b.player_id WHERE b.id=$1`, [id]);
    if (rows[0] && rows[0].user_id) await notification.notify(rows[0].user_id, 'Your booking was moved', `New schedule: ${tz.scheduleLine(moved.starts_at, moved.ends_at, rows[0])}.`, 'booking');
    return moved;
  });
}
/** 2-hour (setting) reminder. Runs on the server clock; stops when the booking is no longer confirmed. */
async function sendReminders() {
  const h = await settings.get('booking_reminder_hours');
  const { rows } = await query(`SELECT b.id, b.starts_at, b.ends_at, p.user_id, c.name, c.court_number FROM bookings b JOIN courts c ON c.id=b.court_id JOIN players p ON p.id=b.player_id
    WHERE b.status='confirmed' AND b.reminder_sent_at IS NULL AND b.starts_at > now() AND b.starts_at <= $1`, [new Date(Date.now() + Number(h) * 3600000)]);
  for (const r of rows) { await notification.notify(r.user_id, 'Game reminder', `Your game starts soon: ${tz.scheduleLine(r.starts_at, r.ends_at, r)}.`, 'reminder'); await query('UPDATE bookings SET reminder_sent_at=now() WHERE id=$1', [r.id]); }
  return rows.length;
}
/** Joined view used by lists and notifications: always carries Date, Time and Court name/number (rule E). */
const SELECT_VIEW = `SELECT b.*, c.name AS court_name, c.court_number, p.first_name || ' ' || p.last_name AS player_name, p.id AS player_id_ref,
  (SELECT status FROM payments pay WHERE pay.booking_id=b.id ORDER BY pay.created_at DESC LIMIT 1) AS payment_status
  FROM bookings b JOIN courts c ON c.id=b.court_id LEFT JOIN players p ON p.id=b.player_id`;
function present(b) {
  const court = { name: b.court_name, court_number: b.court_number };
  return { ...b, date_label: tz.formatDate(b.starts_at), time_label: tz.formatRange(b.starts_at, b.ends_at), court_label: `${b.court_name} (Court ${b.court_number})`, schedule_line: tz.scheduleLine(b.starts_at, b.ends_at, court), price_label: tz.peso(b.price) };
}
module.exports = { hourRate, quote, slotGrid, alternatives, create, createRecurring, expirePending, sendReminders, cancel, move, SELECT_VIEW, present };
