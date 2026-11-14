const players = require('../../../../shared/services/players');
const accounts = require('../../../../shared/services/accounts');
const notification = require('../../../../shared/services/notification');
const perm = require('../../../../middleware/requirePermission');
const { query } = require('../../../../config/db');
const { audit } = require('../../../../shared/services/audit');
exports.list = q => players.list({ q: q.q || '', status: q.status || '', level: q.level || '' });
// Front desk: only name, mobile or email, and a permanent password are required.
exports.create = async (b, req) => { const r = await accounts.createAccount(req.user, 'player', b, req); return { id: r.id, message: 'Player added. They can sign in with the password you set.' }; };
exports.get = async (id, req) => players.get(id, req, { canSeeSensitive: await perm.has(req.user, 'sensitive_view') });
exports.update = async (id, b, req) => { await players.update(id, b, players.FRONT_DESK_EDITABLE, req); return { ok: true, message: 'Changes saved.' }; };
exports.resend = async (id, req) => { const { rows } = await query(`SELECT p.user_id, u.status FROM players p JOIN users u ON u.id=p.user_id WHERE p.id=$1`, [id]); if (!rows[0] || rows[0].status !== 'invited') return { ok: true, message: 'This player already has an account.' }; await notification.notify(rows[0].user_id, 'Set up your DinkNest account', 'Open Player Login and tap "First time here? Set up your account".', 'invite'); await audit(req, 'account.resend_invite', 'player', id); return { ok: true, message: 'Invite sent again.' }; };
exports.reset = async (id, req) => { const { rows } = await query('SELECT user_id FROM players WHERE id=$1', [id]); return accounts.resetPassword(req.user, rows[0].user_id, req); };
exports.verify = async (id, req) => { await players.verifyLevel(id, req.user, req.body.note); return { ok: true, message: 'Level confirmed.' }; };
exports.archive = async (id, req) => { const r = await players.setArchived(id, true); await accounts.setStatus(req.user, r.user_id, 'archived', req); return { ok: true, message: 'Removed from the list. You can bring it back later (ask the admin).' }; };
