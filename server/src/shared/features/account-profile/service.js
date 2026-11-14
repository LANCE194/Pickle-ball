const { query } = require('../../../config/db');
const { audit } = require('../../services/audit');
const { HttpError } = require('../../utils');
const { PERSONAL_FIELD_LIMITS, validateProfileFields, cleanProfileField } = require('../../services/profileFields');

const EDITABLE = PERSONAL_FIELD_LIMITS;
const PROFILE_QUERY = `SELECT s.first_name, s.middle_name, s.last_name, s.nickname, s.birthdate, s.gender,
  s.street, s.barangay, s.city, s.province, s.photo_path, s.emergency_name, s.emergency_relationship,
  s.emergency_number, s.position_title, s.employee_id, u.email, u.mobile, u.role
  FROM staff_profiles s JOIN users u ON u.id=s.user_id
  WHERE u.id=$1 AND u.role IN ('admin','staff')`;

exports.get = async req => {
  const { rows } = await query(PROFILE_QUERY, [req.user.id]);
  if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
  await audit(req, 'sensitive.view', 'staff_profile', req.user.id, { self: true });
  return rows[0];
};

exports.update = async (body, req) => {
  const errors = validateProfileFields(body, EDITABLE);
  if (Object.keys(errors).length) {
    throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: errors });
  }

  const fields = Object.keys(body || {}).filter(field => Object.hasOwn(EDITABLE, field));
  if (fields.length) {
    const values = [req.user.id];
    const sets = fields.map(field => {
      values.push(cleanProfileField(body[field], EDITABLE[field]));
      return `${field}=$${values.length}`;
    });
    const { rows } = await query(`UPDATE staff_profiles SET ${sets.join(',')}, updated_at=now()
      WHERE user_id=$1 AND EXISTS (
        SELECT 1 FROM users u WHERE u.id=staff_profiles.user_id AND u.role IN ('admin','staff')
      ) RETURNING id`, values);
    if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
    await audit(req, 'profile.update', 'staff_profile', req.user.id, { fields });
  }
  return exports.get(req);
};

exports.photo = async (user, file, req) => {
  const { rows } = await query(`UPDATE staff_profiles SET photo_path=$2, updated_at=now()
    WHERE user_id=$1 AND EXISTS (
      SELECT 1 FROM users u WHERE u.id=staff_profiles.user_id AND u.role IN ('admin','staff')
    ) RETURNING id`, [user.id, file.path]);
  if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
  await audit(req, 'profile.photo.update', 'staff_profile', user.id);
  return { ok: true, photo_path: file.path };
};
