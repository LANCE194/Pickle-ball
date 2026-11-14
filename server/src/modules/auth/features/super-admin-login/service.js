const bcrypt = require('bcryptjs');
const { query } = require('../../../../config/db');
const env = require('../../../../config/env');
const a = require('../../../../shared/services/authlogic');
const { audit } = require('../../../../shared/services/audit');
const { HttpError } = require('../../../../shared/utils');
const GENERIC = () => new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
const secondFactorRequired = env.superAdminSecondFactor !== 'none';
// Super Admin requires a password change on first login; the authenticator is configurable.
exports.login = async ({ email, password, code }, req) => {
  const u = await a.checkPassword(['super_admin'], email, password, req);
  if (u.must_change_password || (secondFactorRequired && !u.totp_enrolled)) return { stage: 'setup', setupToken: a.newSetupToken(u.id), needsPassword: u.must_change_password, needsTotp: secondFactorRequired && !u.totp_enrolled };
  if (secondFactorRequired) {
    if (!code) return { stage: 'code' };
    if (!a.totpVerify(u.totp_secret, code)) { await audit(req, 'superadmin.login.bad_code', 'user', u.id); throw GENERIC(); }
  }
  const s = await a.openSession(u, req);
  await audit({ ...req, user: { id: u.id, role: 'super_admin' }, ip: req.ip }, 'superadmin.login.alert', 'user', u.id, { ip: req.ip }); // login alert
  return s;
};
exports.setupPassword = async ({ setupToken, newPassword }, req) => {
  const t = a.takeSetup(setupToken); const p = a.passwordProblem(newPassword);
  if (p) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { newPassword: p } });
  await query('UPDATE users SET password_hash=$2, must_change_password=false, updated_at=now() WHERE id=$1', [t.userId, await bcrypt.hash(newPassword, 12)]);
  await audit(req, 'superadmin.password_changed', 'user', t.userId);
  const { rows } = await query('SELECT totp_enrolled FROM users WHERE id=$1', [t.userId]);
  const needsTotp = secondFactorRequired && !rows[0].totp_enrolled;
  return { stage: needsTotp ? 'totp' : 'done', setupToken, message: needsTotp ? 'Now set up your authenticator app.' : 'Password changed. Log in again.' };
};
exports.setupTotp = async ({ setupToken }) => {
  if (!secondFactorRequired) throw new HttpError(404, 'Not found');
  const t = a.takeSetup(setupToken); const { rows } = await query('SELECT email, must_change_password, totp_enrolled FROM users WHERE id=$1', [t.userId]);
  if (rows[0].must_change_password) throw new HttpError(409, 'Change your password first.'); if (rows[0].totp_enrolled) throw new HttpError(409, 'The second factor is already set up.');
  const n = a.totpNew(rows[0].email); await query('UPDATE users SET totp_secret=$2 WHERE id=$1', [t.userId, n.secret]); return { secret: n.secret, uri: n.uri };
};
exports.confirmTotp = async ({ setupToken, code }, req) => {
  if (!secondFactorRequired) throw new HttpError(404, 'Not found');
  const t = a.takeSetup(setupToken); const { rows } = await query('SELECT * FROM users WHERE id=$1', [t.userId]); const u = rows[0];
  if (!u.totp_secret || !a.totpVerify(u.totp_secret, code)) throw new HttpError(422, 'That code did not work. Check your authenticator app and try again.', 'BAD_CODE');
  await query('UPDATE users SET totp_enrolled=true WHERE id=$1', [u.id]); await audit(req, 'superadmin.totp_enrolled', 'user', u.id);
  return a.openSession({ ...u, totp_enrolled: true }, req);
};
