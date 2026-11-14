const { query } = require('../../../../config/db');
const payment = require('../../../../shared/services/payment');
const qr = require('../../../../shared/services/qr');
const upload = require('../../../../middleware/upload');
const tz = require('../../../../config/timezone');
const { HttpError, cleanText } = require('../../../../shared/utils');
const VIEW = `SELECT pay.id, pay.amount, pay.status, pay.reference_code, pay.reject_reason, pay.proof_path IS NOT NULL AS has_proof, pay.created_at, pay.booking_id,
  b.starts_at, b.ends_at, b.expires_at, c.name AS court_name, c.court_number FROM payments pay JOIN players p ON p.id=pay.player_id LEFT JOIN bookings b ON b.id=pay.booking_id LEFT JOIN courts c ON c.id=b.court_id`;
const STATUS_TEXT = { unpaid: 'Send payment proof to confirm', pending_verification: 'Waiting for staff to check your payment', approved: 'You are booked', rejected: 'Payment not accepted', pay_at_court_pending: 'Pay at the court when you arrive', paid_at_court: 'Paid at the court' };
const decorate = r => ({ ...r, amount_label: tz.peso(r.amount), status_text: STATUS_TEXT[r.status], schedule_line: r.starts_at ? tz.scheduleLine(r.starts_at, r.ends_at, { name: r.court_name, court_number: r.court_number }) : null });
exports.list = async user => (await query(`${VIEW} WHERE p.user_id=$1 ORDER BY pay.created_at DESC LIMIT 100`, [user.id])).rows.map(decorate);
exports.one = async (id, user) => { const { rows } = await query(`${VIEW} WHERE p.user_id=$1 AND pay.id=$2`, [user.id, id]); if (!rows[0]) throw new HttpError(404, 'We could not find that payment.'); return { payment: decorate(rows[0]), qr_codes: await qr.list({ onlyEnabled: true }) }; };
exports.proof = async (id, user, file, body) => {
  if (!body.reference_no || !String(body.reference_no).trim()) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { reference_no: 'Type the reference number from your payment receipt.' } });
  await payment.submitProof(id, user.id, { path: file.path, refNo: cleanText(body.reference_no, 60), qrId: body.qr_id || null });
  return { ok: true, message: 'Thank you. Waiting for staff to check your payment.' };
};
exports.payAtCourt = async (id, user) => { const { rows } = await query(`SELECT 1 FROM payments pay JOIN players p ON p.id=pay.player_id WHERE pay.id=$1 AND p.user_id=$2`, [id, user.id]); if (!rows[0]) throw new HttpError(404, 'We could not find that payment.'); await payment.payAtCourt(id); return { ok: true, message: 'You are booked. Please pay at the front desk when you arrive.' }; };
exports.qrFile = async qrId => { const { rows } = await query('SELECT image_path FROM payment_qr_codes WHERE id=$1 AND enabled AND archived_at IS NULL', [qrId]); if (!rows[0]) throw new HttpError(404, 'Not found'); return upload.absolute(rows[0].image_path); };
