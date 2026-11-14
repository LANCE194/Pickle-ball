process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.SUPER_ADMIN_SECOND_FACTOR = 'none';

const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { migrate } = require('../../../../../scripts/migrate');
migrate();
const { query, db } = require('../../../../../config/db');
const service = require('../service');

test('super-admin can finish first-login password setup and sign in without an authenticator', async () => {
  const passwordHash = await bcrypt.hash('Temporary1', 4);
  await query(
    `INSERT INTO users (role, email, password_hash, status, must_change_password)
     VALUES ('super_admin', $1, $2, 'active', true)`,
    ['owner@example.test', passwordHash],
  );
  const req = { ip: '127.0.0.1', headers: { 'user-agent': 'test' } };

  const setup = await service.login({ email: 'owner@example.test', password: 'Temporary1' }, req);
  assert.equal(setup.stage, 'setup');
  assert.equal(setup.needsPassword, true);
  assert.equal(setup.needsTotp, false);
  await assert.rejects(service.setupTotp({ setupToken: setup.setupToken }), error => error.status === 404);

  const result = await service.setupPassword({ setupToken: setup.setupToken, newPassword: 'ChangedPassword1' }, req);
  assert.equal(result.stage, 'done');

  const signedIn = await service.login({ email: 'owner@example.test', password: 'ChangedPassword1' }, req);
  assert.equal(signedIn.user.role, 'super_admin');
  assert.ok(signedIn.token);
});

test.after(() => db.close());
