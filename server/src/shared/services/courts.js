const { query } = require('../../config/db');
const { HttpError, cleanText } = require('../utils');
const realtime = require('../../realtime/gateway');
const tz = require('../../config/timezone');
const { DEFAULT_CLUB_ID } = require('./tenant');
const PUBLIC_COLS = 'id, court_number, name, type, surface, photo_path, hourly_rate, peak_rate, offpeak_rate, status, opens_at, closes_at, peak_start, peak_end, weekend_all_day_peak';
const list = async ({ publicOnly = false, includeArchived = false, q = '', status = '', clubId = DEFAULT_CLUB_ID } = {}) => {
  const { rows } = await query(`SELECT ${publicOnly ? PUBLIC_COLS : '*'} FROM courts WHERE club_id=$4 AND ($1 OR archived_at IS NULL) AND ($2='' OR lower(name) LIKE '%'||lower($2)||'%' OR court_number::text=$2) AND ($3='' OR status::text=$3) ORDER BY court_number`, [includeArchived, q, status, clubId]);
  return rows;
};
const FIELDS_ADMIN = ['court_number', 'name', 'type', 'surface', 'hourly_rate', 'peak_rate', 'offpeak_rate', 'status', 'opens_at', 'closes_at', 'peak_start', 'peak_end', 'weekend_all_day_peak'];
const FIELDS_STAFF = ['name', 'type', 'surface', 'status', 'opens_at', 'closes_at']; // staff: details and status only, no prices, no delete
function check(b, partial) {
  const e = {};
  if (!partial || b.name !== undefined) if (!b.name || !String(b.name).trim()) e.name = 'Give the court a name, for example Court 1 - Indoor.';
  if (!partial || b.court_number !== undefined) if (!Number.isInteger(Number(b.court_number)) || Number(b.court_number) < 1) e.court_number = 'Use a whole number like 1, 2 or 3.';
  for (const k of ['hourly_rate', 'peak_rate', 'offpeak_rate']) if (b[k] !== undefined && (Number.isNaN(Number(b[k])) || Number(b[k]) < 0)) e[k] = 'Use an amount like 400.00.';
  if (b.type !== undefined && !['indoor', 'outdoor'].includes(b.type)) e.type = 'Choose indoor or outdoor.';
  if (b.status !== undefined && !['available', 'maintenance', 'closed'].includes(b.status)) e.status = 'Choose available, maintenance or closed.';
  if (b.opens_at && b.closes_at && b.opens_at >= b.closes_at) e.closes_at = 'Closing time must be later than opening time.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
async function create(b) {
  check(b, false);
  try {
    const { rows } = await query(`INSERT INTO courts (court_number, name, type, surface, hourly_rate, peak_rate, offpeak_rate, status, opens_at, closes_at, peak_start, peak_end, weekend_all_day_peak)
      VALUES ($1,$2,COALESCE($3,'indoor'),$4,COALESCE($5,300),COALESCE($6,400),COALESCE($7,300),COALESCE($8,'available'),COALESCE($9,'06:00'),COALESCE($10,'22:00'),COALESCE($11,'17:00'),COALESCE($12,'21:00'),COALESCE($13,true)) RETURNING *`,
      [b.court_number, cleanText(b.name, 80), b.type, cleanText(b.surface, 80), b.hourly_rate, b.peak_rate, b.offpeak_rate, b.status, b.opens_at, b.closes_at, b.peak_start, b.peak_end, b.weekend_all_day_peak]);
    return rows[0];
  } catch (e) { if (e.code === '23505') throw new HttpError(409, 'That court number is already used. Choose another number.', 'DUPLICATE'); throw e; }
}
async function update(id, b, allowed) {
  check(b, true);
  const sets = [], vals = [id];
  for (const f of allowed) if (b[f] !== undefined) { vals.push(['name', 'surface'].includes(f) ? cleanText(b[f], 80) : b[f]); sets.push(`${f}=$${vals.length}`); }
  if (!sets.length) throw new HttpError(422, 'Nothing to change.');
  try {
    const { rows } = await query(`UPDATE courts SET ${sets.join(',')}, updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING *`, vals);
    if (!rows[0]) throw new HttpError(404, 'We could not find that court.');
    realtime.publish('public:availability', 'availability.changed', { court_id: id }); return rows[0];
  } catch (e) { if (e.code === '23505') throw new HttpError(409, 'That court number is already used.', 'DUPLICATE'); throw e; }
}
async function setArchived(id, archived) {
  if (archived) { const { rows } = await query(`SELECT 1 FROM bookings WHERE court_id=$1 AND status IN ('pending','confirmed') AND starts_at > now() LIMIT 1`, [id]); if (rows.length) throw new HttpError(409, 'This court has upcoming bookings. Move or cancel them first.'); }
  const { rows } = await query('UPDATE courts SET archived_at = CASE WHEN $2 THEN now() ELSE NULL END, updated_at=now() WHERE id=$1 RETURNING *', [id, archived]);
  if (!rows[0]) throw new HttpError(404, 'We could not find that court.'); return rows[0];
}
const setPhoto = async (id, path) => (await query('UPDATE courts SET photo_path=$2, updated_at=now() WHERE id=$1 RETURNING *', [id, path])).rows[0];
async function blocks(courtId = null) {
  const { rows } = await query(`SELECT b.*, c.name AS court_name, c.court_number FROM court_blocks b JOIN courts c ON c.id=b.court_id WHERE b.archived_at IS NULL AND b.ends_at > now() ${courtId ? 'AND b.court_id=$1' : ''} ORDER BY b.starts_at`, courtId ? [courtId] : []);
  return rows.map(r => ({ ...r, date_label: tz.formatDate(r.starts_at), time_label: tz.formatRange(r.starts_at, r.ends_at), court_label: `${r.court_name} (Court ${r.court_number})` }));
}
async function addBlock(courtId, { date, start = '00:00', end = '23:59', endDate, reason }, userId) {
  if (!date) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { date: 'Pick the date to block.' } });
  const s = tz.manilaToUtc(date, start), e = endDate ? tz.manilaToUtc(endDate, end) : tz.manilaToUtc(date, end);
  if (e <= s) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { end: 'The end must be after the start.' } });
  const { rows: clash } = await query(`SELECT 1 FROM bookings WHERE court_id=$1 AND status IN ('pending','confirmed') AND starts_at < $3 AND ends_at > $2 LIMIT 1`, [courtId, s, e]);
  if (clash.length) throw new HttpError(409, 'There are bookings in that time. Move or cancel them first, then block the court.', 'HAS_BOOKINGS');
  const { rows } = await query('INSERT INTO court_blocks (court_id, starts_at, ends_at, reason, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *', [courtId, s, e, cleanText(reason, 200), userId]);
  realtime.publish('public:availability', 'availability.changed', { court_id: courtId }); return rows[0];
}
async function removeBlock(id) { const { rows } = await query('UPDATE court_blocks SET archived_at=now() WHERE id=$1 RETURNING court_id', [id]); if (rows[0]) realtime.publish('public:availability', 'availability.changed', {}); }
module.exports = { list, create, update, setArchived, setPhoto, blocks, addBlock, removeBlock, FIELDS_ADMIN, FIELDS_STAFF };
