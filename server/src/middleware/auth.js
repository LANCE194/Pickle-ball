const { query } = require('../config/db');
const { sha256, HttpError } = require('../shared/utils');
const settings = require('../shared/services/settings');
const { DEFAULT_CLUB_ID } = require('../shared/services/tenant');

// A user who must change a temporary password may only call these.
const ALLOWED_WHEN_MUST_CHANGE = ['/api/auth/me', '/api/auth/change-password', '/api/auth/logout', '/api/time'];

/** Reads the per-tab bearer token. Never trusts a shared cookie. Sets req.user or leaves it undefined. */
async function auth(req, res, next) {
  try {
    if (req.tenantBlocked) {
      return next(new HttpError(403, 'This host is not active yet. Verify the domain and HTTPS before signing in.', 'DOMAIN_BLOCKED'));
    }
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : (req.query && req.query.token) || null;
    if (!token) return next();
    const clubId = req.club && req.club.id ? req.club.id : DEFAULT_CLUB_ID;
    const { rows } = await query(`SELECT s.id AS sid, s.club_id AS session_club_id, s.last_seen_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL`, [sha256(token)]);
    const r = rows[0]; if (!r) return next();
    if (r.session_club_id !== clubId) return next();
    if (r.role !== 'super_admin' && r.club_id !== clubId) return next();
    const firstLoginTeam = r.status === 'invited' && r.must_change_password && r.role !== 'player'; // new team accounts may only set their password
    if (r.status !== 'active' && !firstLoginTeam) return next(); // suspended / archived / invited players cannot use a session
    const idle = (await settings.get('session_idle_minutes')) * 60000;
    if (Date.now() - new Date(r.last_seen_at).getTime() > idle) { await query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [r.sid]); return next(); }
    query('UPDATE sessions SET last_seen_at=now() WHERE id=$1', [r.sid])
      .catch(error => console.error('Session activity update failed:', error.message));
    req.user = { id: r.id, role: r.role, email: r.email, mobile: r.mobile, sessionId: r.sid, clubId: r.club_id, mustChangePassword: r.must_change_password };
    if (r.must_change_password && !ALLOWED_WHEN_MUST_CHANGE.includes(req.originalUrl.split('?')[0])) {
      return next(new HttpError(403, 'Please set a new password first.', 'PASSWORD_CHANGE_REQUIRED'));
    }
    next();
  } catch (e) { next(e); }
}
const requireAuth = (req, res, next) => (req.user ? next() : next(new HttpError(401, 'Please log in.', 'UNAUTHENTICATED')));
module.exports = { auth, requireAuth };
