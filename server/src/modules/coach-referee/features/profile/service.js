const { query } = require('../../../../config/db');
const { audit } = require('../../../../shared/services/audit');
const { ageFromBirthdate, HttpError } = require('../../../../shared/utils');
const { PERSONAL_FIELD_LIMITS, validateProfileFields, cleanProfileField } = require('../../../../shared/services/profileFields');
const EDITABLE = { ...PERSONAL_FIELD_LIMITS, specialization: 200 };
exports.get = async req => {
  const { rows } = await query(`SELECT r.*, u.email, u.mobile FROM referee_profiles r
    JOIN users u ON u.id=r.user_id WHERE r.user_id=$1 AND u.role='coach_referee'`, [req.user.id]);
  if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
  await audit(req, 'sensitive.view', 'referee_profile', req.user.id, { self: true });
  return { ...rows[0], age: ageFromBirthdate(rows[0].birthdate) };
};
exports.update = async (body, req) => {
  const errors = validateProfileFields(body, EDITABLE);
  if (Object.keys(errors).length) {
    throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: errors });
  }
  const fields = Object.keys(body || {});
  if (fields.length) {
    const values = [req.user.id];
    const sets = fields.map(field => {
      values.push(cleanProfileField(body[field], EDITABLE[field]));
      return `${field}=$${values.length}`;
    });
    const { rows } = await query(`UPDATE referee_profiles SET ${sets.join(',')}, updated_at=now()
      WHERE user_id=$1 AND EXISTS (
        SELECT 1 FROM users u WHERE u.id=referee_profiles.user_id AND u.role='coach_referee'
      ) RETURNING id`, values);
    if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
    await audit(req, 'profile.update', 'referee_profile', req.user.id, { fields });
  }
  return exports.get(req);
};
exports.photo = async (user, file, req) => {
  const { rows } = await query(`UPDATE referee_profiles SET photo_path=$2, updated_at=now()
    WHERE user_id=$1 AND EXISTS (
      SELECT 1 FROM users u WHERE u.id=referee_profiles.user_id AND u.role='coach_referee'
    ) RETURNING id`, [user.id, file.path]);
  if (!rows[0]) throw new HttpError(404, 'We could not find your profile.');
  await audit(req, 'profile.photo.update', 'referee_profile', user.id);
  return { ok: true, photo_path: file.path };
};
