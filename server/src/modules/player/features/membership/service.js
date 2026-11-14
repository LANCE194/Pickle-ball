const { query } = require('../../../../config/db');
const m = require('../../../../shared/services/membership');
const tz = require('../../../../config/timezone');
const { HttpError } = require('../../../../shared/utils');
const pid = async uid => { const { rows } = await query('SELECT id FROM players WHERE user_id=$1', [uid]); if (!rows[0]) throw new HttpError(404, 'We could not find your profile.'); return rows[0].id; };
exports.mine = async user => { const cur = await m.myMembership(await pid(user.id)); return cur ? { ...cur, expires_label: tz.formatDate(cur.expires_on + 'T00:00:00+08:00') } : null; };
exports.plans = async () => (await m.plans()).map(p => ({ ...p, price_label: tz.peso(p.price) }));
// Joining or renewing creates a pending payment that goes through the QR flow; the membership becomes active when staff approve it.
exports.join = async ({ plan_id }, user) => { const r = await m.addMembership(await pid(user.id), plan_id, null, { pendingPayment: true }); return { payment_id: r.payment.id, message: `Send payment for ${r.plan.name} to start your membership.` }; };
