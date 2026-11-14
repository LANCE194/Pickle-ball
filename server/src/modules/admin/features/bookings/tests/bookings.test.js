const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
test('admin/bookings: manifest is complete and has a README', () => {
  const m = require('../index.js');
  assert.equal(m.folder, 'bookings');
  assert.ok(typeof m.router === 'function', 'router must be an express router');
  assert.ok(m.mountPath.startsWith('/api/'));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'README.md')));
});
test('admin/bookings: does not import from another feature or role', () => {
  for (const file of ['routes.js', 'controller.js', 'service.js', 'validator.js']) {
    const p = path.join(__dirname, '..', file); if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    assert.ok(!/require\(['"]\.\.\/\.\.\/(?!\.)/.test(src) || !/features\//.test(src), 'no cross-feature imports');
    assert.ok(!/require\(['"][^'"]*modules\/[^'"]*['"]\)/.test(src.replace(/require\('\.\.\/\.\.\/loader'\)/, '')), 'no role imports');
  }
});
