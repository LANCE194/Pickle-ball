const { cleanText, isName } = require('../utils');

const PERSONAL_FIELD_LIMITS = {
  first_name: 60,
  middle_name: 60,
  last_name: 60,
  nickname: 80,
  birthdate: 10,
  gender: 30,
  street: 200,
  barangay: 100,
  city: 100,
  province: 100,
  emergency_name: 120,
  emergency_relationship: 60,
  emergency_number: 30,
};

function validateProfileFields(body, limits = PERSONAL_FIELD_LIMITS) {
  const errors = {};
  const allowed = new Set(Object.keys(limits));
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { _request: 'Send your profile details as an object.' };
  }
  const fields = body;

  for (const key of Object.keys(fields)) {
    if (!allowed.has(key)) errors[key] = 'This field can only be changed by your club owner.';
  }

  for (const name of ['first_name', 'last_name']) {
    if (fields[name] !== undefined && !isName(fields[name])) {
      errors[name] = 'Use letters only, for example Maria.';
    }
  }
  if (fields.middle_name && !isName(fields.middle_name)) errors.middle_name = 'Use letters only.';

  for (const [field, max] of Object.entries(limits)) {
    const value = fields[field];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string') {
      errors[field] = 'Enter text for this field.';
    } else if (value.length > max) {
      errors[field] = `Use ${max} characters or fewer.`;
    }
  }

  if (fields.birthdate) {
    const date = new Date(fields.birthdate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.birthdate) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== fields.birthdate ||
        date > new Date()) {
      errors.birthdate = 'Enter a valid birthdate that is not in the future.';
    }
  }

  return errors;
}

function cleanProfileField(value, max) {
  const cleaned = cleanText(value, max);
  return cleaned || null;
}

module.exports = { PERSONAL_FIELD_LIMITS, validateProfileFields, cleanProfileField };
