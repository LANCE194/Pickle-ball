const m = require('../../../../shared/services/membership');
const accounts = require('../../../../shared/services/accounts');
const players = require('../../../../shared/services/players');
const payment = require('../../../../shared/services/payment');
const { audit } = require('../../../../shared/services/audit');
const tz = require('../../../../config/timezone');
exports.plans = async () => (await m.plans(true)).map(p => ({ ...p, price_label: tz.peso(p.price) }));
exports.savePlan = async (b, id, req) => { const p = await m.savePlan(b, id); await audit(req, id ? 'plan.update' : 'plan.create', 'membership_plan', p.id); return p; };
exports.members = ({ q, plan, status, level, expiring }) => m.members({ q: q || '', plan: plan || '', status: status || '', level: level || '', expiringDays: expiring ? Number(expiring) : null });
// "Add member" creates a player account with the password supplied on the form and membership in ONE step.
exports.addMember = async (b, req) => {
  const acc = await accounts.createAccount(req.user, 'player', b, req); const { rows } = await require('../../../../config/db').query('SELECT id FROM players WHERE user_id=$1', [acc.id]);
  let paid = false;
  if (b.plan_id) { const r = await m.addMembership(rows[0].id, b.plan_id, null, { pendingPayment: true }); if (b.paid_now) { await payment.payAtCourt(r.payment.id); await payment.approve(r.payment.id, req.user); paid = true; } }
  await audit(req, 'member.add', 'player', rows[0].id);
  return { player_id: rows[0].id, message: paid ? 'Member added and paid.' : 'Member added. Approve their payment to start the membership.' };
};
exports.renew = async (playerId, b, req) => { const r = await m.addMembership(playerId, b.plan_id, null, { pendingPayment: true }); if (b.paid_now) { await payment.payAtCourt(r.payment.id); await payment.approve(r.payment.id, req.user); } await audit(req, 'member.renew', 'player', playerId); return { ok: true, payment_id: r.payment.id, message: b.paid_now ? 'Membership renewed.' : 'Renewal created. Approve the payment to activate it.' }; };
exports.archive = async (id, archive, req) => { const r = await players.setArchived(id, archive); await accounts.setStatus(req.user, r.user_id, archive ? 'archived' : 'active', req); await audit(req, archive ? 'player.archive' : 'player.restore', 'player', id); return { ok: true, message: archive ? 'Removed from the list. You can bring it back later.' : 'Player restored.' }; };
const notification = require('../../../../shared/services/notification');
const dbq = require('../../../../config/db').query;
// Admin sees and edits players too (sensitive fields are viewable by admin and every view is audit-logged).
exports.players = q => players.list({ q: q.q || '', status: q.status || '', level: q.level || '', includeArchived: q.archived === 'true' });
exports.addPlayer = async (b, req) => { const r = await accounts.createAccount(req.user, 'player', b, req); return { id: r.id, message: 'Player added. They can sign in with the password you set.' }; };
exports.getPlayer = (id, req) => players.get(id, req, { canSeeSensitive: true });
exports.updatePlayer = async (id, b, req) => { await players.update(id, b, players.FRONT_DESK_EDITABLE, req); return { ok: true, message: 'Changes saved.' }; };
exports.resend = async (id, req) => { const { rows } = await dbq(`SELECT p.user_id, u.status FROM players p JOIN users u ON u.id=p.user_id WHERE p.id=$1`, [id]); if (!rows[0] || rows[0].status !== 'invited') return { ok: true, message: 'This player already has an account.' }; await notification.notify(rows[0].user_id, 'Set up your DinkNest account', 'Open Player Login and tap "First time here? Set up your account".', 'invite'); await audit(req, 'account.resend_invite', 'player', id); return { ok: true, message: 'Invite sent again.' }; };
exports.resetPlayer = async (id, req) => { const { rows } = await dbq('SELECT user_id FROM players WHERE id=$1', [id]); return accounts.resetPassword(req.user, rows[0].user_id, req); };
exports.verify = async (id, req) => { await players.verifyLevel(id, req.user, req.body.note); return { ok: true, message: 'Level confirmed.' }; };
exports.override = async (id, req) => { await players.overrideLevel(id, req.user, req.body.rating, req.body.note); await audit(req, 'player.level_override', 'player', id, req.body); return { ok: true, message: 'Level changed.' }; };
