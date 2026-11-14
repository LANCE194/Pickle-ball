// Account creation chain (A0): Super Admin -> Admin -> Staff, Coach/Referee, Player. Enforced here and logged.
const bcrypt = require('bcryptjs');
const { query, tx } = require('../../config/db');
const { CREATOR_OF } = require('../constants');
const { HttpError, tempPassword, normalizeMobile, isEmail, isName, cleanText, ageFromBirthdate, passwordProblem } = require('../utils');
const { audit } = require('./audit');
const sessions = require('./session');
const { DEFAULT_CLUB_ID } = require('./tenant');

const PROFILE_TABLE = { admin: 'staff_profiles', staff: 'staff_profiles', coach_referee: 'referee_profiles', player: 'players' };
const COMMON = ['first_name', 'middle_name', 'last_name', 'nickname', 'birthdate', 'gender', 'street', 'barangay', 'city', 'province', 'emergency_name', 'emergency_relationship', 'emergency_number'];
const EXTRA = {
  admin: ['club_name', 'business_address', 'business_contact', 'business_permit_no', 'position_title'],
  staff: ['employee_id', 'position_title', 'work_schedule', 'date_hired', 'employment_status', 'permission_template'],
  coach_referee: ['role_type', 'certification_name', 'certification_no', 'certifying_body', 'certification_expiry', 'specialization', 'years_experience', 'level_min', 'level_max'],
  player: ['skill_level', 'dominant_hand', 'preferred_format', 'height_cm', 'occupation', 'heard_about', 'shirt_size', 'guardian_name', 'guardian_relationship', 'guardian_contact', 'guardian_consent'],
};
/** Plain-words validation of the account form. Returns {field: message}. */
function validate(role, b) {
  const e = {};
  if (!isName(b.first_name)) e.first_name = 'Use letters only, for example Maria.';
  if (!isName(b.last_name)) e.last_name = 'Use letters only, for example Santos.';
  if (b.middle_name && !isName(b.middle_name)) e.middle_name = 'Use letters only.';
  if (!b.email && !b.mobile) e.mobile = 'Add a mobile number or an email so we can reach this person.';
  if (b.mobile && !normalizeMobile(b.mobile)) e.mobile = 'Use a Philippine mobile number like 0917 123 4567.';
  if (b.email && !isEmail(b.email)) e.email = 'Check the email, for example name@email.com.';
  if (role !== 'player' && !b.email) e.email = 'Team accounts need an email to log in.';
  const passwordError = passwordProblem(b.password); if (passwordError) e.password = passwordError;
  if (b.birthdate) { const d = new Date(b.birthdate); if (Number.isNaN(d.getTime()) || d > new Date()) e.birthdate = 'Birthdate cannot be in the future.'; }
  if (role === 'player' && b.birthdate) { const age = ageFromBirthdate(b.birthdate); if (age !== null && age < 18 && (!b.guardian_name || !b.guardian_contact)) e.guardian_name = 'Players under 18 need a guardian name and contact.'; }
  if (role === 'coach_referee' && b.role_type && !['coach', 'referee', 'both'].includes(b.role_type)) e.role_type = 'Choose coach, referee or both.';
  return e;
}
/** Create an account. `creator` is req.user. Never creates a super_admin. */
async function createAccount(creator, role, body, req) {
  if (role === 'super_admin') throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  if (!CREATOR_OF[role] || !CREATOR_OF[role].includes(creator.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  const errors = validate(role, body); if (Object.keys(errors).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: errors });
  const mobile = normalizeMobile(body.mobile); const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const clubId = req && req.club && req.club.id ? req.club.id : (creator && creator.clubId) || DEFAULT_CLUB_ID;
  const dup = await query('SELECT 1 FROM users WHERE club_id=$3 AND ((email IS NOT NULL AND lower(email)=$1) OR (mobile IS NOT NULL AND mobile=$2))', [email, mobile, clubId]);
  if (dup.rows.length) throw new HttpError(409, 'Someone with this email or mobile number already exists in this club.', 'DUPLICATE');
  const out = await tx(async db => {
    const { rows } = await db.query(`INSERT INTO users (club_id, role, email, mobile, password_hash, status, must_change_password, temp_password_expires_at, created_by)
      VALUES ($1,$2,$3,$4,$5,'active',false,NULL,$6) RETURNING id`, [clubId, role, email, mobile, await bcrypt.hash(body.password, 11), creator.id]);
    const uid = rows[0].id; const table = PROFILE_TABLE[role];
    const cols = [...COMMON, ...EXTRA[role]].filter(c => body[c] !== undefined && body[c] !== '' && body[c] !== null);
    const vals = cols.map(c => typeof body[c] === 'string' ? cleanText(body[c], 300) : body[c]);
    await db.query(`INSERT INTO ${table} (user_id, ${cols.join(',')}${role === 'player' ? ',created_by' : ''}) VALUES ($1${cols.map((_, i) => `,$${i + 2}`).join('')}${role === 'player' ? `,$${cols.length + 2}` : ''})`,
      [uid, ...vals, ...(role === 'player' ? [creator.id] : [])]);
    return uid;
  });
  await audit(req, `account.create.${role}`, 'user', out, { created_by: creator.id, club_id: clubId });
  return { id: out };
}
/** Password reset follows the same chain. Returns the new temporary password (shown once). */
async function resetPassword(creator, targetId, req) {
  const { rows } = await query('SELECT id, role, club_id FROM users WHERE id=$1', [targetId]); const t = rows[0];
  if (!t || t.role === 'super_admin') throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  if (t.role === 'player') { if (!['admin', 'staff'].includes(creator.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); }
  else if (!CREATOR_OF[t.role].includes(creator.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  const temp = tempPassword();
  await query(`UPDATE users SET password_hash=$2, must_change_password=true, temp_password_expires_at=now()+interval '7 days', failed_logins=0, locked_until=NULL, status=CASE WHEN status='invited' THEN 'invited' ELSE 'active' END WHERE id=$1`, [targetId, await bcrypt.hash(temp, 11)]);
  await sessions.revokeAllForUser(targetId);
  await audit(req, 'account.reset_password', 'user', targetId, { club_id: t.club_id });
  return { temporaryPassword: temp };
}
/** Suspend / reactivate / archive. Suspending revokes ALL sessions at once. */
async function setStatus(actor, targetId, status, req) {
  const { rows } = await query('SELECT id, role, club_id FROM users WHERE id=$1', [targetId]); const t = rows[0];
  if (!t || t.role === 'super_admin') throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  const allowed = t.role === 'player' ? ['admin', 'staff', 'super_admin'] : (CREATOR_OF[t.role] || []);
  if (!allowed.includes(actor.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  await query(`UPDATE users SET status=$2, archived_at = CASE WHEN $2='archived' THEN now() ELSE NULL END, updated_at=now() WHERE id=$1`, [targetId, status]);
  if (['suspended', 'archived'].includes(status)) await sessions.revokeAllForUser(targetId);
  await audit(req, `account.${status}`, 'user', targetId, { club_id: t.club_id });
}
module.exports = { createAccount, resetPassword, setStatus, validate, PROFILE_TABLE };
