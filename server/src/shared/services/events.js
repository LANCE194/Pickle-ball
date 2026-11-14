const { query } = require('../../config/db');
const { HttpError, cleanText } = require('../utils');
const tz = require('../../config/timezone');
const { DEFAULT_CLUB_ID } = require('./tenant');
const decorate = e => ({ ...e, date_label: e.event_starts_at ? `${tz.formatDate(e.event_starts_at)}, ${tz.formatTime(e.event_starts_at)}` : null });
/** audience: 'guest' (public only), 'member' (public + members), 'staff' (everything). */
async function list(audience = 'guest', { includeArchived = false, clubId = DEFAULT_CLUB_ID } = {}) {
  const vis = audience === 'guest' ? `AND visibility='public'` : '';
  const { rows } = await query(`SELECT * FROM announcements WHERE club_id=$2 AND ($1 OR archived_at IS NULL) ${vis} ORDER BY pinned DESC, COALESCE(event_starts_at, created_at) DESC LIMIT 100`, [includeArchived, clubId]);
  return rows.map(decorate);
}
function check(b) {
  const e = {};
  if (!b.title || !String(b.title).trim()) e.title = 'Add a short title, for example Sunday Open Play.';
  if (!b.body || !String(b.body).trim()) e.body = 'Tell people what this is about.';
  if (b.visibility && !['public', 'members'].includes(b.visibility)) e.visibility = 'Choose public or members only.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
async function save(b, userId, id = null, { canPin = true } = {}) {
  check(b);
  const when = b.event_date ? tz.manilaToUtc(b.event_date, b.event_time || '09:00') : (b.event_starts_at || null);
  const v = [cleanText(b.title, 120), cleanText(b.body, 4000), canPin ? !!b.pinned : false, b.visibility || 'public', when];
  if (id) { const { rows } = await query('UPDATE announcements SET title=$2, body=$3, pinned=$4, visibility=$5, event_starts_at=$6 WHERE id=$1 AND archived_at IS NULL RETURNING *', [id, ...v]); if (!rows[0]) throw new HttpError(404, 'We could not find that post.'); return rows[0]; }
  return (await query('INSERT INTO announcements (title, body, pinned, visibility, event_starts_at, posted_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [...v, userId])).rows[0];
}
const setImage = async (id, path) => (await query('UPDATE announcements SET image_path=$2 WHERE id=$1 RETURNING *', [id, path])).rows[0];
const setArchived = async (id, a) => (await query('UPDATE announcements SET archived_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id=$1 RETURNING *', [id, a])).rows[0];
module.exports = { list, save, setImage, setArchived };
