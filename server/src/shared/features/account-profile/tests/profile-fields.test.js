const test = require('node:test');
const assert = require('node:assert');
const { PERSONAL_FIELD_LIMITS, validateProfileFields } = require('../../../services/profileFields');

test('account profiles require valid names and reject a future or malformed birthdate', () => {
  const invalid = validateProfileFields({ first_name: '', last_name: 'Santos', birthdate: '2024-02-31' });
  assert.ok(invalid.first_name);
  assert.ok(invalid.birthdate);

  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  assert.ok(validateProfileFields({ birthdate: future }).birthdate);
  assert.deepEqual(validateProfileFields({ first_name: 'Maria', last_name: 'Santos', birthdate: '1992-06-15' }), {});
});

test('account profiles reject owner-managed fields and overlong values', () => {
  const invalid = validateProfileFields({
    position_title: 'Owner',
    permissions: { sensitive_view: true },
    street: 'x'.repeat(PERSONAL_FIELD_LIMITS.street + 1),
  });
  assert.ok(invalid.position_title);
  assert.ok(invalid.permissions);
  assert.ok(invalid.street);
});

test('account profiles reject non-object update bodies', () => {
  assert.ok(validateProfileFields('invalid')._request);
  assert.ok(validateProfileFields(null)._request);
});
