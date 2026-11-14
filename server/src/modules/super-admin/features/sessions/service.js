const { query } = require('../../../../config/db');
const sessions = require('../../../../shared/services/session');
const { audit } = require('../../../../shared/services/audit');
exports.list = async () => (await query(`SELECT s.id, s.role, s.device_info, s.created_at, s.last_seen_at, u.email, u.mobile FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.revoked_at IS NULL ORDER BY s.last_seen_at DESC LIMIT 300`)).rows;
exports.revoke = async (id, req) => { await sessions.revoke(id); await audit(req, 'session.revoke', 'session', id); return { ok: true }; }; // the tab is signed out at once through the realtime channel
