const { query, tx } = require('../../config/db');
const { referenceCode, HttpError } = require('../utils');
const realtime = require('../../realtime/gateway');
const notification = require('./notification');
const tz = require('../../config/timezone');
async function createFor({ bookingId = null, entryId = null, membershipId = null, playerId, amount }, db = null) {
  const d = db || { query };
  const { rows } = await d.query(`INSERT INTO payments (booking_id, tournament_entry_id, membership_id, player_id, amount, reference_code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [bookingId, entryId, membershipId, playerId, amount, referenceCode()]);
  return rows[0];
}
async function submitProof(paymentId, playerUserId, { path, refNo, qrId }) {
  const { rows } = await query(`SELECT pay.*, pl.user_id FROM payments pay JOIN players pl ON pl.id=pay.player_id WHERE pay.id=$1`, [paymentId]);
  const p = rows[0]; if (!p || p.user_id !== playerUserId) throw new HttpError(404, 'We could not find that payment.');
  if (!['unpaid', 'rejected'].includes(p.status)) throw new HttpError(409, 'This payment was already sent for checking.');
  if (p.booking_id) { const { rows: b } = await query('SELECT status FROM bookings WHERE id=$1', [p.booking_id]); if (b[0] && b[0].status === 'expired') throw new HttpError(409, 'The hold on this booking ended. Please book again.'); }
  await query(`UPDATE payments SET status='pending_verification', proof_path=$2, proof_reference_no=$3, qr_code_id=$4, reject_reason=NULL, updated_at=now() WHERE id=$1`, [paymentId, path, refNo, qrId || null]);
  if (p.booking_id) await query(`UPDATE bookings SET expires_at = NULL, updated_at=now() WHERE id=$1 AND status='pending'`, [p.booking_id]); // proof sent: hold no longer expires
  realtime.publish('staffside', 'payment.queue', { id: paymentId, kind: 'new_proof' });
  await notification.notifyRoles(['staff', 'admin'], 'New payment to check', `Reference ${p.reference_code}, ${tz.peso(p.amount)}.`, 'payment');
}
async function approve(paymentId, reviewer) {
  return tx(async db => {
    const { rows } = await db.query(`SELECT pay.*, pl.user_id AS player_user FROM payments pay LEFT JOIN players pl ON pl.id=pay.player_id WHERE pay.id=$1 FOR UPDATE`, [paymentId]);
    const p = rows[0]; if (!p) throw new HttpError(404, 'We could not find that payment.');
    if (!['pending_verification', 'pay_at_court_pending'].includes(p.status)) throw new HttpError(409, 'This payment was already checked.');
    await db.query(`UPDATE payments SET status=$2, reviewed_by=$3, reviewed_at=now(), updated_at=now() WHERE id=$1`, [paymentId, p.status === 'pay_at_court_pending' ? 'paid_at_court' : 'approved', reviewer.id]);
    let line = '';
    if (p.booking_id) {
      const { rows: b } = await db.query(`UPDATE bookings SET status='confirmed', expires_at=NULL, updated_at=now() WHERE id=$1 AND status IN ('pending','confirmed') RETURNING *`, [p.booking_id]);
      if (!b[0]) throw new HttpError(409, 'That booking is no longer active, so the payment cannot be approved.');
      const { rows: c } = await db.query('SELECT name, court_number FROM courts WHERE id=$1', [b[0].court_id]); line = ' ' + tz.scheduleLine(b[0].starts_at, b[0].ends_at, c[0]);
    }
    if (p.tournament_entry_id) await db.query(`UPDATE tournament_entries SET status = CASE WHEN status='pending' THEN 'approved' ELSE status END WHERE id=$1`, [p.tournament_entry_id]);
    if (p.membership_id) await db.query(`UPDATE memberships SET status='active' WHERE id=$1`, [p.membership_id]);
    return { p, line };
  }).then(async ({ p, line }) => {
    if (p.player_user) await notification.notify(p.player_user, 'You are booked', `Payment ${p.reference_code} was accepted.${line}`, 'payment');
    realtime.publish('staffside', 'payment.queue', { id: paymentId, kind: 'approved' });
    realtime.publish('public:availability', 'availability.changed', {});
    return p;
  });
}
async function reject(paymentId, reviewer, reason) {
  if (!reason || !String(reason).trim()) throw new HttpError(422, 'Please write the reason so the player knows what to fix.', 'VALIDATION');
  const { rows } = await query(`UPDATE payments SET status='rejected', reject_reason=$2, reviewed_by=$3, reviewed_at=now(), updated_at=now() WHERE id=$1 AND status='pending_verification' RETURNING *`, [paymentId, reason, reviewer.id]);
  const p = rows[0]; if (!p) throw new HttpError(409, 'This payment was already checked.');
  const { rows: u } = await query('SELECT user_id FROM players WHERE id=$1', [p.player_id]);
  if (u[0]) await notification.notify(u[0].user_id, 'Payment not accepted', `Reason: ${reason}. You can send new proof.`, 'payment');
  realtime.publish('staffside', 'payment.queue', { id: paymentId, kind: 'rejected' });
  return p;
}
async function payAtCourt(paymentId) {
  const { rows } = await query(`UPDATE payments SET status='pay_at_court_pending', updated_at=now() WHERE id=$1 AND status IN ('unpaid','rejected') RETURNING *`, [paymentId]);
  if (!rows[0]) throw new HttpError(409, 'This payment cannot be changed.');
  if (rows[0].booking_id) await query(`UPDATE bookings SET expires_at=NULL, status='confirmed', updated_at=now() WHERE id=$1 AND status='pending'`, [rows[0].booking_id]);
  realtime.publish('staffside', 'payment.queue', { id: paymentId, kind: 'pay_at_court' });
  return rows[0];
}
module.exports = { createFor, submitProof, approve, reject, payAtCourt };
