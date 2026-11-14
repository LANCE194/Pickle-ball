const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('admin/account-profile: manifest is scoped to Admin and has a README', () => {
  const manifest = require('../index.js');
  assert.equal(manifest.folder, 'account-profile');
  assert.deepEqual(manifest.roles, ['admin']);
  assert.equal(manifest.featureKey, null);
  assert.ok(typeof manifest.router === 'function');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'README.md')));
});
