const { query } = require('../../../../config/db');
const accounts = require('../../../../shared/services/accounts');
const { audit } = require('../../../../shared/services/audit');
const { HttpError } = require('../../../../shared/utils');
const TEMPLATES = { staff_50: { bookings: true, payments: true, courts_edit: true, members_edit: true, events_post: true, matches_score: true, sensitive_view: false }, front_desk_only: { bookings: true, payments: false, courts_edit: false, members_edit: true, events_post: false, matches_score: false, sensitive_view: false } };
const KEYS = ['bookings', 'payments', 'courts_edit', 'members_edit', 'events_post', 'matches_score', 'sensitive_view'];
exports.list = async ({ q = '' }) => (await query(`SELECT u.id AS user_id, u.role, u.email, u.mobile, u.status, u.last_login_at, COALESCE(s.first_name, r.first_name) AS first_name, COALESCE(s.last_name, r.last_name) AS last_name, s.position_title, s.employee_id, s.permission_template, s.permissions, r.role_type, r.certification_expiry
  FROM users u LEFT JOIN staff_profiles s ON s.user_id=u.id LEFT JOIN referee_profiles r ON r.user_id=u.id WHERE u.role IN ('staff','coach_referee') AND ($1='' OR lower(coalesce(s.first_name,r.first_name)||' '||coalesce(s.last_name,r.last_name)) LIKE '%'||lower($1)||'%') ORDER BY u.created_at DESC`, [q])).rows;
// Only the Admin creates Staff and Coach/Referee accounts (checked again inside accounts.createAccount).
exports.create = async (b, req) => {
  if (!['staff', 'coach_referee'].includes(b.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  if (req.user.role !== 'admin') throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); // super_admin cannot create staff either (account chain)
  const r = await accounts.createAccount(req.user, b.role, b, req);
  if (b.role === 'staff') await query('UPDATE staff_profiles SET permissions=$2, permission_template=$3 WHERE user_id=$1', [r.id, JSON.stringify(TEMPLATES[b.permission_template] || TEMPLATES.staff_50), TEMPLATES[b.permission_template] ? b.permission_template : 'staff_50']);
  return { user_id: r.id, message: 'Account created. They can sign in with the password you set.' };
};
exports.permissions = async (userId, b, req) => {
  const { rows } = await query(`SELECT permissions FROM staff_profiles s JOIN users u ON u.id=s.user_id WHERE s.user_id=$1 AND u.role='staff'`, [userId]); if (!rows[0]) throw new HttpError(404, 'We could not find that staff member.');
  const next = b.template && TEMPLATES[b.template] ? { ...TEMPLATES[b.template] } : { ...rows[0].permissions };
  for (const k of KEYS) if (typeof (b.permissions || {})[k] === 'boolean') next[k] = b.permissions[k];
  await query('UPDATE staff_profiles SET permissions=$2, permission_template=$3, updated_at=now() WHERE user_id=$1', [userId, JSON.stringify(next), b.template || 'custom']); await audit(req, 'staff.permissions', 'user', userId, next); return { ok: true, permissions: next };
};
exports.reset = (userId, req) => accounts.resetPassword(req.user, userId, req);
exports.status = async (userId, status, req) => { if (!['active', 'suspended', 'archived'].includes(status)) throw new HttpError(422, 'Choose active, suspended or archived.'); await accounts.setStatus(req.user, userId, status, req); return { ok: true, message: status === 'suspended' ? 'Account suspended. They were signed out everywhere.' : 'Account updated.' }; };
