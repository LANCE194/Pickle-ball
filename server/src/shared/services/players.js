const { query } = require('../../config/db');
const { HttpError, cleanText, ageFromBirthdate, maskTail, isName, normalizeMobile } = require('../utils');
const { audit } = require('./audit');
const rating = require('./rating');
const SENSITIVE = ['birthdate', 'street', 'barangay', 'city', 'province', 'emergency_name', 'emergency_relationship', 'emergency_number', 'medical_notes', 'guardian_name', 'guardian_contact'];
const OWN_EDITABLE = ['nickname', 'middle_name', 'gender', 'birthdate', 'street', 'barangay', 'city', 'province', 'emergency_name', 'emergency_relationship', 'emergency_number', 'dominant_hand', 'preferred_format', 'height_cm', 'occupation', 'heard_about', 'shirt_size', 'medical_notes', 'guardian_name', 'guardian_relationship', 'guardian_contact', 'guardian_consent', 'skill_level'];
const FRONT_DESK_EDITABLE = ['first_name', 'middle_name', 'last_name', 'nickname', 'birthdate', 'gender', 'street', 'barangay', 'city', 'province', 'emergency_name', 'emergency_relationship', 'emergency_number', 'dominant_hand', 'preferred_format', 'height_cm', 'occupation', 'heard_about', 'shirt_size', 'guardian_name', 'guardian_relationship', 'guardian_contact', 'guardian_consent', 'status'];
const SELECT = `SELECT p.*, u.email, u.mobile, u.status AS login_status FROM players p JOIN users u ON u.id=p.user_id`;
const mask = p => { const o = { ...p }; for (const k of SENSITIVE) if (o[k] !== null && o[k] !== undefined) o[k] = k === 'birthdate' ? '****-**-**' : maskTail(String(o[k]), 2); o.sensitive_masked = true; return o; };
const withAge = p => ({ ...p, age: p.birthdate && !String(p.birthdate).includes('*') ? ageFromBirthdate(p.birthdate) : null });
/** Lists always mask sensitive fields. */
async function list({ q = '', status = '', level = '', limit = 100, offset = 0, includeArchived = false } = {}) {
  const { rows } = await query(`${SELECT} WHERE ($1 OR p.archived_at IS NULL) AND ($2='' OR lower(p.first_name||' '||p.last_name||' '||coalesce(p.nickname,'')) LIKE '%'||lower($2)||'%' OR u.mobile LIKE '%'||$2||'%' OR lower(coalesce(u.email,'')) LIKE '%'||lower($2)||'%')
    AND ($3='' OR p.status::text=$3) AND ($4='' OR p.skill_level=$4) ORDER BY lower(p.last_name), lower(p.first_name) LIMIT $5 OFFSET $6`, [includeArchived, q, status, level, limit, offset]);
  return rows.map(r => withAge(mask(r)));
}
/** canSeeSensitive: owner, admin, staff with permission. Every sensitive view is written to audit_logs. */
async function get(id, req, { canSeeSensitive = false } = {}) {
  const { rows } = await query(`${SELECT} WHERE p.id=$1`, [id]); const p = rows[0]; if (!p) throw new HttpError(404, 'We could not find that player.');
  if (!canSeeSensitive) return withAge(mask(p));
  await audit(req, 'sensitive.view', 'player', id, { fields: SENSITIVE });
  return withAge({ ...p, sensitive_masked: false });
}
const mine = async userId => { const { rows } = await query(`${SELECT} WHERE p.user_id=$1`, [userId]); if (!rows[0]) throw new HttpError(404, 'We could not find your profile.'); return rows[0]; };
function validate(b) {
  const e = {};
  for (const k of ['first_name', 'last_name']) if (b[k] !== undefined && !isName(b[k])) e[k] = 'Use letters only.';
  if (b.birthdate) { const d = new Date(b.birthdate); if (Number.isNaN(d.getTime()) || d > new Date()) e.birthdate = 'Birthdate cannot be in the future.'; }
  if (b.emergency_number && !normalizeMobile(b.emergency_number)) e.emergency_number = 'Use a mobile number like 0917 123 4567.';
  if (b.height_cm !== undefined && b.height_cm !== '' && (!(Number(b.height_cm) >= 100 && Number(b.height_cm) <= 250))) e.height_cm = 'Use centimetres, for example 170.';
  if (b.dominant_hand && !['left', 'right', 'both'].includes(b.dominant_hand)) e.dominant_hand = 'Choose left, right or both.';
  if (b.preferred_format && !['singles', 'doubles', 'mixed'].includes(b.preferred_format)) e.preferred_format = 'Choose singles, doubles or mixed.';
  if (b.status && !['active', 'inactive', 'suspended', 'pending_verification'].includes(b.status)) e.status = 'Choose a valid status.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
async function update(id, b, allowed, req) {
  validate(b);
  const sets = [], vals = [id];
  for (const f of allowed) if (b[f] !== undefined) { vals.push(typeof b[f] === 'string' ? cleanText(b[f], 300) || null : b[f]); sets.push(`${f}=$${vals.length}`); }
  if (b.waiver_accepted === true && allowed.includes('skill_level')) { sets.push('waiver_accepted=true', 'waiver_accepted_at=now()'); }
  if (b.privacy_consent === true && allowed.includes('skill_level')) sets.push('privacy_consent=true');
  if (!sets.length) throw new HttpError(422, 'Nothing to change.');
  const { rows } = await query(`UPDATE players SET ${sets.join(',')}, updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING *`, vals);
  if (!rows[0]) throw new HttpError(404, 'We could not find that player.');
  await audit(req, 'player.update', 'player', id, { fields: Object.keys(b) }); return rows[0];
}
const setPhoto = async (id, path) => (await query('UPDATE players SET photo_path=$2, updated_at=now() WHERE id=$1 RETURNING id', [id, path])).rows[0];
/** Staff or coach confirms the level; admin can override with a required note. Everything lands in rating_history. */
async function verifyLevel(id, user, note) {
  const { rows } = await query('SELECT rating FROM players WHERE id=$1', [id]); if (!rows[0]) throw new HttpError(404, 'We could not find that player.');
  await query('UPDATE players SET level_verified=true, updated_at=now() WHERE id=$1', [id]);
  await query(`INSERT INTO rating_history (player_id, old_rating, new_rating, reason, changed_by) VALUES ($1,$2,$2,$3,$4)`, [id, rows[0].rating, `Level verified${note ? ': ' + cleanText(note, 200) : ''}`, user.id]);
}
async function overrideLevel(id, user, newRating, note) {
  const r = Number(newRating); const fields = {};
  if (!(r >= 1 && r <= 6.5)) fields.rating = 'Use a rating from 1.0 to 6.5.';
  if (!note || String(note).trim().length < 3) fields.note = 'Please write why you are changing this level.';
  if (Object.keys(fields).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields });
  const { rows } = await query('SELECT rating FROM players WHERE id=$1', [id]); if (!rows[0]) throw new HttpError(404, 'We could not find that player.');
  await query('UPDATE players SET rating=$2, skill_level=$3, level_verified=true, updated_at=now() WHERE id=$1', [id, r, rating.levelFor(r)]);
  await query(`INSERT INTO rating_history (player_id, old_rating, new_rating, reason, changed_by) VALUES ($1,$2,$3,$4,$5)`, [id, rows[0].rating, r, `Admin override: ${cleanText(note, 200)}`, user.id]);
}
async function history(id) {
  const { rows } = await query(`SELECT h.*, COALESCE(sp.first_name||' '||sp.last_name, 'System') AS changed_by_name, u.role AS changed_by_role FROM rating_history h LEFT JOIN users u ON u.id=h.changed_by LEFT JOIN staff_profiles sp ON sp.user_id=u.id WHERE h.player_id=$1 ORDER BY h.created_at DESC LIMIT 100`, [id]);
  return rows;
}
/** Stats, badges, match history and upcoming bookings for the profile page. */
async function overview(id) {
  const tz = require('../../config/timezone');
  const { rows: ms } = await query(`SELECT m.id, m.status, m.winner_entry, m.starts_at, m.ends_at, m.entry_a, m.entry_b, t.name AS tournament, c.name AS court_name, c.court_number
    FROM matches m JOIN tournament_entries ea ON ea.id=m.entry_a LEFT JOIN tournament_entries eb ON eb.id=m.entry_b LEFT JOIN tournaments t ON t.id=m.tournament_id LEFT JOIN courts c ON c.id=m.court_id
    WHERE (ea.player_id=$1 OR ea.partner_id=$1 OR eb.player_id=$1 OR eb.partner_id=$1) ORDER BY m.starts_at DESC NULLS LAST LIMIT 30`, [id]);
  const { rows: bk } = await query(`SELECT b.id, b.starts_at, b.ends_at, b.status, c.name AS court_name, c.court_number FROM bookings b JOIN courts c ON c.id=b.court_id WHERE b.player_id=$1 AND b.starts_at > now() AND b.status IN ('pending','confirmed') ORDER BY b.starts_at LIMIT 10`, [id]);
  const { rows: pe } = await query(`SELECT e.id, e.player_id, e.partner_id, e.id AS entry_id FROM tournament_entries e WHERE e.player_id=$1 OR e.partner_id=$1`, [id]);
  const decorate = m => ({ ...m, date_label: m.starts_at ? tz.formatDate(m.starts_at) : null, time_label: m.starts_at ? tz.formatRange(m.starts_at, m.ends_at) : null, court_label: m.court_name ? `${m.court_name} (Court ${m.court_number})` : null });
  const played = ms.filter(m => m.status === 'completed'); const entryIds = new Set(pe.map(p => p.entry_id)); const wins = played.filter(m => entryIds.has(m.winner_entry)).length;
  const { rows: att } = await query('SELECT count(*)::int AS n FROM attendance WHERE player_id=$1', [id]);
  const badges = []; if (wins >= 1) badges.push('First win'); if (wins >= 10) badges.push('10 wins'); if (att[0].n >= 10) badges.push('Regular (10 visits)'); if (played.length >= 5) badges.push('Match veteran');
  return { stats: { matches: played.length, wins, losses: played.length - wins, visits: att[0].n }, badges, matches: ms.map(decorate), upcoming: bk.map(decorate) };
}
const setArchived = async (id, a) => { const { rows } = await query('UPDATE players SET archived_at = CASE WHEN $2 THEN now() ELSE NULL END, status = CASE WHEN $2 THEN \'inactive\' ELSE status END, updated_at=now() WHERE id=$1 RETURNING user_id', [id, a]); if (!rows[0]) throw new HttpError(404, 'We could not find that player.'); return rows[0]; };
module.exports = { list, get, mine, update, setPhoto, verifyLevel, overrideLevel, history, overview, setArchived, OWN_EDITABLE, FRONT_DESK_EDITABLE, SENSITIVE, mask };
