const { query } = require('../../config/db');
/** Write one audit row. Never throws: auditing must not break the request. */
async function audit(req, action, entity = null, entityId = null, details = null, db = null) {
  try {
    const u = req && req.user;
    await (db || { query }).query(
      `INSERT INTO audit_logs (user_id, role, action, entity, entity_id, details, ip, session_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [u ? u.id : null, u ? u.role : null, action, entity, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null, req ? req.ip : null, u ? u.sessionId : null]);
  } catch (e) { console.error('audit failed', e.message); }
}
module.exports = { audit };
