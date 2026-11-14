const { query, tx } = require('../../config/db');
const { HttpError, cleanText } = require('../utils');
const payment = require('./payment');
const notification = require('./notification');
const tz = require('../../config/timezone');
const plans = async (all = false) => (await query(`SELECT * FROM membership_plans WHERE ($1 OR (archived_at IS NULL AND active)) AND archived_at IS NULL ORDER BY price`, [all])).rows;
function checkPlan(b) {
  const e = {};
  if (!b.name || !String(b.name).trim()) e.name = 'Give the plan a name, for example Monthly Member.';
  if (Number.isNaN(Number(b.price)) || Number(b.price) < 0) e.price = 'Use an amount like 1500.00.';
  if (!Number.isInteger(Number(b.duration_days)) || Number(b.duration_days) < 1) e.duration_days = 'Use a number of days like 30.';
  if (b.discount_percent !== undefined && !(Number(b.discount_percent) >= 0 && Number(b.discount_percent) <= 100)) e.discount_percent = 'Use 0 to 100.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
async function savePlan(b, id = null) {
  checkPlan(b); const v = [cleanText(b.name, 80), b.price, b.duration_days, b.discount_percent || 0, !!b.priority_booking, cleanText(b.perks, 400), b.active !== false];
  if (id) { const { rows } = await query('UPDATE membership_plans SET name=$2, price=$3, duration_days=$4, discount_percent=$5, priority_booking=$6, perks=$7, active=$8 WHERE id=$1 RETURNING *', [id, ...v]); if (!rows[0]) throw new HttpError(404, 'We could not find that plan.'); return rows[0]; }
  return (await query('INSERT INTO membership_plans (name, price, duration_days, discount_percent, priority_booking, perks, active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', v)).rows[0];
}
const archivePlan = async id => { await query('UPDATE membership_plans SET archived_at=now(), active=false WHERE id=$1', [id]); };
async function members({ q = '', plan = '', status = '', level = '', expiringDays = null } = {}) {
  await refreshStatuses();
  const { rows } = await query(`SELECT m.*, pl.name AS plan_name, pl.discount_percent, p.first_name, p.last_name, p.skill_level, p.rating, u.mobile, u.email FROM memberships m JOIN players p ON p.id=m.player_id JOIN users u ON u.id=p.user_id JOIN membership_plans pl ON pl.id=m.plan_id
    WHERE m.archived_at IS NULL AND ($1='' OR lower(p.first_name||' '||p.last_name) LIKE '%'||lower($1)||'%') AND ($2='' OR pl.id::text=$2) AND ($3='' OR m.status::text=$3) AND ($4='' OR p.skill_level=$4)
    AND ($5::int IS NULL OR m.expires_on <= current_date + $5::int) ORDER BY m.expires_on`, [q, plan, status, level, expiringDays]);
  return rows;
}
/** Mark expiring/expired. Expired members stop getting discounts because booking.quote only counts active/expiring and not-yet-expired rows. */
async function refreshStatuses() {
  const days = require('./settings').get('membership_reminder_days');
  const d = await days;
  await query(`UPDATE memberships SET status='expired' WHERE status IN ('active','expiring') AND expires_on < (now() AT TIME ZONE 'Asia/Manila')::date`);
  await query(`UPDATE memberships SET status='expiring' WHERE status='active' AND expires_on <= (now() AT TIME ZONE 'Asia/Manila')::date + $1::int`, [d]);
}
async function addMembership(playerId, planId, db = null, payInfo = {}) {
  const run = async c => {
    const { rows: pl } = await c.query('SELECT * FROM membership_plans WHERE id=$1 AND archived_at IS NULL', [planId]); if (!pl[0]) throw new HttpError(404, 'We could not find that plan.');
    const { rows: cur } = await c.query(`SELECT expires_on FROM memberships WHERE player_id=$1 AND status IN ('active','expiring') AND archived_at IS NULL ORDER BY expires_on DESC LIMIT 1`, [playerId]);
    const start = cur[0] && cur[0].expires_on >= tz.manilaDate(new Date()) ? cur[0].expires_on : tz.manilaDate(new Date()); // renew continues from the old expiry
    const exp = new Date(new Date(start + 'T00:00:00Z').getTime() + pl[0].duration_days * 86400000).toISOString().slice(0, 10);
    const { rows } = await c.query(`INSERT INTO memberships (player_id, plan_id, starts_on, expires_on, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [playerId, planId, start, exp, payInfo.pendingPayment ? 'expired' : 'active']);
    let pay = null;
    if (payInfo.pendingPayment) pay = await payment.createFor({ membershipId: rows[0].id, playerId, amount: pl[0].price }, c);
    return { membership: rows[0], plan: pl[0], payment: pay };
  };
  return db ? run(db) : tx(run);
}
async function sendReminders() {
  await refreshStatuses(); const d = await require('./settings').get('membership_reminder_days');
  const { rows } = await query(`SELECT m.id, m.expires_on, p.user_id, pl.name FROM memberships m JOIN players p ON p.id=m.player_id JOIN membership_plans pl ON pl.id=m.plan_id WHERE m.status='expiring' AND m.reminder_sent_at IS NULL AND m.expires_on <= current_date + $1::int`, [d]);
  for (const r of rows) { await notification.notify(r.user_id, 'Your membership ends soon', `Your ${r.name} membership ends on ${tz.formatDate(r.expires_on + 'T00:00:00+08:00')}. Renew to keep your member discount.`, 'membership'); await query('UPDATE memberships SET reminder_sent_at=now() WHERE id=$1', [r.id]); }
  return rows.length;
}
const myMembership = async playerId => { await refreshStatuses(); return (await query(`SELECT m.*, pl.name AS plan_name, pl.discount_percent, pl.perks, pl.priority_booking FROM memberships m JOIN membership_plans pl ON pl.id=m.plan_id WHERE m.player_id=$1 AND m.archived_at IS NULL ORDER BY m.expires_on DESC LIMIT 1`, [playerId])).rows[0] || null; };
async function checkIn(playerId, user, method = 'name', bookingId = null) {
  const { rows: p } = await query(`SELECT id, first_name, last_name, status FROM players WHERE id=$1 AND archived_at IS NULL`, [playerId]); if (!p[0]) throw new HttpError(404, 'We could not find that player.');
  if (p[0].status === 'suspended') throw new HttpError(409, 'This player is suspended. Please check with the admin.');
  const { rows: dup } = await query(`SELECT 1 FROM attendance WHERE player_id=$1 AND checked_in_at > now() - interval '2 hours' LIMIT 1`, [playerId]);
  if (dup.length) throw new HttpError(409, 'This player was already checked in within the last 2 hours.');
  await query('INSERT INTO attendance (player_id, booking_id, checked_in_by, method) VALUES ($1,$2,$3,$4)', [playerId, bookingId, user.id, method]);
  require('../../realtime/gateway').publish('staffside', 'attendance.changed', {});
  return p[0];
}
async function attendance({ date = null, playerId = null, clubId = null } = {}) {
  const { rows } = await query(`SELECT a.*, p.first_name, p.last_name, c.name AS court_name, c.court_number FROM attendance a JOIN players p ON p.id=a.player_id LEFT JOIN bookings b ON b.id=a.booking_id AND b.club_id=p.club_id LEFT JOIN courts c ON c.id=b.court_id AND c.club_id=p.club_id
    WHERE ($1::date IS NULL OR (a.checked_in_at AT TIME ZONE 'Asia/Manila')::date=$1::date) AND ($2::uuid IS NULL OR a.player_id=$2::uuid) AND ($3::uuid IS NULL OR p.club_id=$3::uuid) ORDER BY a.checked_in_at DESC LIMIT 500`, [date, playerId, clubId]);
  return rows.map(r => ({ ...r, date_label: tz.formatDate(r.checked_in_at), time_label: tz.formatTime(r.checked_in_at) }));
}
module.exports = { plans, savePlan, archivePlan, members, refreshStatuses, addMembership, sendReminders, myMembership, checkIn, attendance };
