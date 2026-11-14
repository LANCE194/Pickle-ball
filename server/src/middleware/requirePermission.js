const { query } = require('../config/db');
const { HttpError } = require('../shared/utils');
// Staff permission toggles (bookings, payments, courts_edit, members_edit, events_post, matches_score, sensitive_view). Admin and Super Admin always pass.
module.exports = key => async (req, res, next) => {
  try {
    if (['admin', 'super_admin'].includes(req.user.role)) return next();
    const { rows } = await query('SELECT permissions FROM staff_profiles WHERE user_id=$1 AND archived_at IS NULL', [req.user.id]);
    if (rows[0] && rows[0].permissions && rows[0].permissions[key] === true) return next();
    next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
  } catch (e) { next(e); }
};
module.exports.has = async (user, key) => { if (['admin', 'super_admin'].includes(user.role)) return true; const { rows } = await query('SELECT permissions FROM staff_profiles WHERE user_id=$1', [user.id]); return !!(rows[0] && rows[0].permissions && rows[0].permissions[key] === true); };
