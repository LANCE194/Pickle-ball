const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
test('coach-referee/profile: manifest is complete and has a README', () => {
  const m = require('../index.js');
  assert.equal(m.folder, 'profile');
  assert.ok(typeof m.router === 'function', 'router must be an express router');
  assert.ok(m.mountPath.startsWith('/api/'));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'README.md')));
});
test('coach-referee/profile: does not import from another feature or role', () => {
  for (const file of ['routes.js', 'controller.js', 'service.js', 'validator.js']) {
    const p = path.join(__dirname, '..', file); if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    assert.ok(!/require\(['"]\.\.\/\.\.\/(?!\.)/.test(src) || !/features\//.test(src), 'no cross-feature imports');
    assert.ok(!/require\(['"][^'"]*modules\/[^'"]*['"]\)/.test(src.replace(/require\('\.\.\/\.\.\/loader'\)/, '')), 'no role imports');
  }
});
test('coach-referee/profile: supports personal details and profile photos', () => {
  const routes = fs.readFileSync(path.join(__dirname, '..', 'routes.js'), 'utf8');
  assert.match(routes, /r\.post\('\/photo'/);
  const service = fs.readFileSync(path.join(__dirname, '..', 'service.js'), 'utf8');
  assert.match(service, /PERSONAL_FIELD_LIMITS/);
  assert.match(service, /profile\.photo\.update/);
});
