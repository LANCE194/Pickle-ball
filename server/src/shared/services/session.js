const { query } = require('../../config/db');
const { sha256, randomToken } = require('../utils');
const { DEFAULT_CLUB_ID } = require('./tenant');
const realtime = require('../../realtime/gateway');

/** Create a session for ONE tab. Many sessions per user are allowed (rule D). */
async function create(user, req) {
  const token = randomToken(32);
  const clubId = (req && req.club && req.club.id) || user.club_id || DEFAULT_CLUB_ID;
  const { rows } = await query(`INSERT INTO sessions (user_id, role, club_id, token_hash, device_info) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [user.id, user.role, clubId, sha256(token), String(req.headers['user-agent'] || '').slice(0, 200)]);
  await query('UPDATE users SET last_login_at=now(), failed_logins=0, locked_until=NULL WHERE id=$1', [user.id]);
  return { token, sessionId: rows[0].id };
}
const revoke = async sessionId => { await query('UPDATE sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL', [sessionId]); realtime.publish(`session:${sessionId}`, 'session.revoked', {}); };
async function revokeAllForUser(userId) {
  const { rows } = await query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL RETURNING id', [userId]);
  for (const r of rows) realtime.publish(`session:${r.id}`, 'session.revoked', {});
  return rows.length;
}
module.exports = { create, revoke, revokeAllForUser };
