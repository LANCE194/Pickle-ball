const settings = require('./settings');
const { HttpError } = require('../utils');
const ADMIN_KEYS = ['booking_hold_minutes', 'cancellation_cutoff_hours', 'tournament_rest_minutes', 'membership_reminder_days', 'booking_reminder_hours', 'min_booking_hours', 'max_booking_hours', 'opening_time', 'closing_time', 'peak_start', 'peak_end', 'club_name'];
const SUPER_KEYS = [...ADMIN_KEYS, 'failed_login_limit', 'lock_minutes', 'session_idle_minutes', 'image_limit_mb'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
async function save(body, keys, userId) {
  const fields = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!keys.includes(k)) continue;
    if (['opening_time', 'closing_time', 'peak_start', 'peak_end'].includes(k)) { if (!TIME.test(v)) fields[k] = 'Use a time like 06:00.'; }
    else if (k === 'club_name') { if (!String(v).trim()) fields[k] = 'Type the club name.'; }
    else if (!(Number(v) > 0)) fields[k] = 'Use a number greater than 0.';
  }
  if (Object.keys(fields).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields });
  for (const [k, v] of Object.entries(body)) if (keys.includes(k)) await settings.set(k, ['opening_time', 'closing_time', 'peak_start', 'peak_end', 'club_name'].includes(k) ? String(v).slice(0, 80) : Number(v), userId);
  const all = await settings.getAll(); return Object.fromEntries(keys.map(k => [k, all[k]]));
}
async function get(keys) { const all = await settings.getAll(); return Object.fromEntries(keys.map(k => [k, all[k]])); }
module.exports = { ADMIN_KEYS, SUPER_KEYS, save, get };
