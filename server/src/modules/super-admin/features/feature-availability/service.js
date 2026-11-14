const { query } = require('../../../../config/db');
const feature = require('../../../../shared/services/feature');
const notification = require('../../../../shared/services/notification');
const { audit } = require('../../../../shared/services/audit');
const { HttpError, cleanText } = require('../../../../shared/utils');
exports.list = () => feature.load(true);
exports.set = async (key, b, req) => { await feature.setAvailability(key, { available: typeof b.available === 'boolean' ? b.available : null, locked: typeof b.locked === 'boolean' ? b.locked : null }); await audit(req, 'feature.availability', 'feature', key, b); return { ok: true }; };
exports.requests = async () => (await query(`SELECT r.*, COALESCE(s.first_name||' '||s.last_name, u.email) AS requested_by_name FROM feature_requests r JOIN users u ON u.id=r.requested_by LEFT JOIN staff_profiles s ON s.user_id=u.id ORDER BY r.created_at DESC LIMIT 200`)).rows;
exports.setRequest = async (id, { status, note }, req) => {
  if (!['new', 'reviewing', 'accepted', 'in_progress', 'done', 'declined'].includes(status)) throw new HttpError(422, 'Choose a valid status.');
  const { rows } = await query('UPDATE feature_requests SET status=$2, status_note=$3, updated_at=now() WHERE id=$1 RETURNING *', [id, status, cleanText(note, 500)]); if (!rows[0]) throw new HttpError(404, 'We could not find that request.');
  await notification.notify(rows[0].requested_by, 'Feature request update', `"${rows[0].title}" is now ${status.replace('_', ' ')}${note ? ': ' + cleanText(note, 200) : ''}.`, 'feature'); await audit(req, 'feature.request.status', 'feature_request', id, { status }); return rows[0];
};
