const { query } = require('../../../../config/db');
const accounts = require('../../../../shared/services/accounts');
const { HttpError } = require('../../../../shared/utils');
exports.list = async () => (await query(`SELECT u.id, u.email, u.mobile, u.status, u.last_login_at, u.created_at, s.first_name, s.last_name, s.club_name, s.position_title FROM users u LEFT JOIN staff_profiles s ON s.user_id=u.id WHERE u.role='admin' ORDER BY u.created_at DESC`)).rows;
// Only the Super Admin creates Admin (owner) accounts.
exports.create = async (b, req) => { const r = await accounts.createAccount(req.user, 'admin', b, req); return { id: r.id, message: 'Admin account created.' }; };
exports.reset = (id, req) => accounts.resetPassword(req.user, id, req); // Super Admin resets Admin passwords
exports.status = async (id, status, req) => { if (!['active', 'suspended', 'archived'].includes(status)) throw new HttpError(422, 'Choose active, suspended or archived.'); await accounts.setStatus(req.user, id, status, req); return { ok: true }; };
