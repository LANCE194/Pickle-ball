const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const { query } = require('../../config/db');
const env = require('../../config/env');
const settings = require('./settings');
const sessions = require('./session');
const feature = require('./feature');
const { audit } = require('./audit');
const { HttpError, normalizeMobile, isEmail, sha256, otpCode, cleanText, passwordProblem } = require('../utils');
const { FRIENDLY } = require('../constants');
const notification = require('./notification');
const sms = require('./sms');
const GENERIC = new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
authenticator.options = { window: 1 };

async function findUser(identifier, clubId = null, roles = null) {
  const id = String(identifier || '').trim(); if (!id) return null;
  const mobile = normalizeMobile(id); const email = isEmail(id) ? id.toLowerCase() : null;
  if (!mobile && !email) return null;
  const values = [];
  let sql = 'SELECT * FROM users WHERE archived_at IS NULL';
  const globalSuperAdmin = roles && roles.length === 1 && roles[0] === 'super_admin';
  if (roles && !globalSuperAdmin && !clubId) return null;
  if (globalSuperAdmin) sql += " AND role='super_admin' AND club_id IS NULL";
  else if (clubId) { sql += ' AND club_id=$1'; values.push(clubId); }
  if (email) { sql += ' AND lower(email)=$' + (values.length + 1); values.push(email); }
  else { sql += ' AND mobile=$' + (values.length + 1); values.push(mobile); }
  const { rows } = await query(sql, values);
  return rows[0] || null;
}
/** Verify password for one of `roles`. All failures give the same generic error (no role or account hints). */
async function checkPassword(roles, identifier, password, req) {
  const clubId = (req && req.club && req.club.id) || (req && req.clubId) || null;
  const u = await findUser(identifier, clubId, roles); const cfg = await settings.getAll(clubId || undefined);
  const fail = async (why) => { await audit(req, 'login.failed', 'user', u ? u.id : null, { why, roles, club_id: clubId }); throw GENERIC; };
  if (!u || !password) { await bcrypt.compare(String(password || ''), '$2a$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali'); return fail('unknown'); }
  if (u.locked_until && new Date(u.locked_until) > new Date()) return fail('locked');
  if (!roles.includes(u.role)) return fail('role_mismatch');
  if (u.status !== 'active' && !(u.status === 'invited' && u.role !== 'player' && u.password_hash)) return fail('status_' + u.status);
  const ok = u.password_hash && await bcrypt.compare(String(password), u.password_hash);
  if (!ok) {
    const n = u.failed_logins + 1; const lock = n >= cfg.failed_login_limit;
    await query('UPDATE users SET failed_logins=$2, locked_until=$3 WHERE id=$1', [u.id, lock ? 0 : n, lock ? new Date(Date.now() + cfg.lock_minutes * 60000) : null]);
    return fail('bad_password');
  }
  if (u.must_change_password && u.temp_password_expires_at && new Date(u.temp_password_expires_at) < new Date()) return fail('temp_expired');
  return u;
}
async function profileName(u) {
  const table = { player: 'players', coach_referee: 'referee_profiles', admin: 'staff_profiles', staff: 'staff_profiles' }[u.role];
  if (!table) return { display: 'Super Admin' };
  const { rows } = await query(`SELECT first_name, last_name, nickname FROM ${table} WHERE user_id=$1`, [u.id]);
  const r = rows[0]; return { display: r ? (r.nickname || r.first_name) : 'Team member', full: r ? `${r.first_name} ${r.last_name}` : null };
}
async function openSession(u, req) {
  // an invited team member becomes active after setting their own password (see change-password)
  const s = await sessions.create(u, req);
  await audit({ ...req, user: { id: u.id, role: u.role, sessionId: s.sessionId }, ip: req.ip }, 'login.success', 'user', u.id, { role: u.role, club_id: u.club_id || (req && req.club && req.club.id) || null });
  return { token: s.token, user: { id: u.id, role: u.role, mustChangePassword: u.must_change_password, name: (await profileName(u)).display } };
}
async function changePassword(user, current, next, req) {
  const p = passwordProblem(next); if (p) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { newPassword: p } });
  const { rows } = await query('SELECT * FROM users WHERE id=$1', [user.id]); const u = rows[0];
  if (!u.password_hash || !(await bcrypt.compare(String(current || ''), u.password_hash))) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { currentPassword: 'That is not your current password.' } });
  if (current === next) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { newPassword: 'Choose a password you have not used for this account.' } });
  await query(`UPDATE users SET password_hash=$2, must_change_password=false, temp_password_expires_at=NULL, status='active', updated_at=now() WHERE id=$1`, [u.id, await bcrypt.hash(next, 11)]);
  // keep this tab, sign out all other sessions of the account
  await query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL', [u.id, user.sessionId]);
  await audit(req, 'password.changed', 'user', u.id, { club_id: u.club_id });
}
// ---- Player OTP (activation + forgotten password). Generic responses: never reveal who exists. ----
async function requestOtp(contact, purpose, req) {
  const clubId = req && req.club && req.club.id ? req.club.id : null;
  const u = await findUser(contact, clubId);
  const eligible = u && u.role === 'player' && (purpose === 'activation' ? u.status === 'invited' : u.status === 'active');
  if (eligible) {
    const code = otpCode();
    await query(`UPDATE otp_codes SET used_at=now() WHERE user_id=$1 AND used_at IS NULL AND purpose=$2`, [u.id, purpose]);
    await query(`INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes')`, [u.id, sha256(code + u.id), purpose]);
    if (u.email) {
      await notification.notify(u.id, 'Your DinkNest code', `Your code is ${code}. It works for 10 minutes. If you did not ask for it, ignore this message.`, 'otp', undefined, { forceEmail: true });
    } else if (sms.isConfigured()) {
      try {
        await sms.send(u.mobile, `DinkNest code ${code}. It works for 10 minutes. If you did not ask for it, ignore this message.`);
      } catch (error) {
        console.error('SMS OTP delivery failed:', error.message);
      }
    } else if (!env.isProd && !env.sms.provider) {
      console.log(`[sms stub] to ${u.mobile}: DinkNest code ${code}`);
    } else {
      console.error('SMS OTP was not sent because Twilio SMS is not configured.');
    }
    if (!u.email) await query('INSERT INTO notifications (user_id, title, body, kind) VALUES ($1,$2,$3,$4)', [u.id, 'Your DinkNest code', 'A code was sent to your mobile number.', 'otp']);
  }
  await audit(req, 'otp.requested', 'user', eligible ? u.id : null, { purpose, club_id: clubId });
  return { message: 'If the club has this contact on file, a code is on its way. Otherwise, ask the club front desk to add you.' };
}
async function verifyOtp(contact, code, password, purpose, req) {
  const p = passwordProblem(password); if (p) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { password: p } });
  const clubId = req && req.club && req.club.id ? req.club.id : null;
  const u = await findUser(contact, clubId); const bad = new HttpError(422, 'That code did not work. Check it and try again.', 'BAD_CODE');
  if (!u || u.role !== 'player') throw bad;
  const { rows } = await query(`SELECT * FROM otp_codes WHERE user_id=$1 AND purpose=$2 AND used_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 1`, [u.id, purpose]);
  const o = rows[0]; if (!o || o.attempts >= 5) throw bad;
  if (o.code_hash !== sha256(String(code) + u.id)) { await query('UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1', [o.id]); throw bad; }
  await query('UPDATE otp_codes SET used_at=now() WHERE id=$1', [o.id]);
  await query(`UPDATE users SET password_hash=$2, status='active', must_change_password=false, failed_logins=0, locked_until=NULL WHERE id=$1 AND status IN ('invited','active')`, [u.id, await bcrypt.hash(password, 11)]);
  await query(`UPDATE players SET status = CASE WHEN status='pending_verification' THEN 'active' ELSE status END WHERE user_id=$1`, [u.id]);
  await audit(req, purpose === 'activation' ? 'account.activated' : 'password.reset_by_otp', 'user', u.id, { club_id: clubId });
  return u;
}
// ---- Super Admin second factor ----
const setupTokens = new Map(); // setupToken -> { userId, exp } (single-instance; use Redis if you scale out)
const newSetupToken = userId => { const t = require('crypto').randomBytes(24).toString('hex'); setupTokens.set(t, { userId, exp: Date.now() + 10 * 60000 }); return t; };
function takeSetup(t) { const s = setupTokens.get(t); if (!s || s.exp < Date.now()) { setupTokens.delete(t); throw GENERIC; } return s; }
const totpVerify = (secret, code) => { try { return authenticator.check(String(code || '').replace(/\s/g, ''), secret); } catch { return false; } };
const totpNew = email => { const secret = authenticator.generateSecret(); return { secret, uri: authenticator.keyuri(email || 'super-admin', env.totpIssuer, secret) }; };
const meInfo = async user => ({ id: user.id, role: user.role, name: (await profileName(user)).display, features: await feature.enabledMap(user.clubId || undefined), mustChangePassword: user.mustChangePassword, clubId: user.clubId });
module.exports = { checkPassword, openSession, changePassword, requestOtp, verifyOtp, passwordProblem, newSetupToken, takeSetup, totpVerify, totpNew, findUser, profileName, meInfo, FRIENDLY, cleanText };
