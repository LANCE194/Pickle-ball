process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { migrate } = require('../../scripts/migrate');
const { query, db } = require('../../config/db');
const accounts = require('../services/accounts');
const authlogic = require('../services/authlogic');
const { auth } = require('../../middleware/auth');
const { DEFAULT_CLUB_ID } = require('../services/tenant');

migrate();

test('admin and staff create players with the permanent password supplied on the form', async () => {
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ('player-test-admin', $1, 'admin', 'admin@example.test', 'active'),
           ('player-test-staff', $1, 'staff', 'staff@example.test', 'active')`, [DEFAULT_CLUB_ID]);

  for (const actor of [
    { id: 'player-test-admin', role: 'admin' },
    { id: 'player-test-staff', role: 'staff' },
  ]) {
    const req = {
      user: actor,
      club: { id: DEFAULT_CLUB_ID },
      headers: { 'user-agent': 'test' },
      ip: '127.0.0.1',
    };
    const created = await accounts.createAccount(actor, 'player', {
      first_name: 'Jamie',
      last_name: actor.role,
      email: `${actor.role}-player@example.test`,
      password: 'PlayerAccount123',
    }, req);
    assert.equal(Object.prototype.hasOwnProperty.call(created, 'temporaryPassword'), false);

    const { rows } = await query('SELECT * FROM users WHERE id=$1', [created.id]);
    assert.equal(rows[0].status, 'active');
    assert.equal(rows[0].must_change_password, false);
    assert.equal(rows[0].temp_password_expires_at, null);
    assert.equal(await bcrypt.compare('PlayerAccount123', rows[0].password_hash), true);

    const loginReq = { club: { id: DEFAULT_CLUB_ID }, headers: { 'user-agent': 'test' }, ip: '127.0.0.1' };
    const user = await authlogic.checkPassword(['player'], `${actor.role}-player@example.test`, 'PlayerAccount123', loginReq);
    const session = await authlogic.openSession(user, loginReq);
    const sessionReq = {
      headers: { authorization: `Bearer ${session.token}` },
      query: {},
      originalUrl: '/api/bookings',
      club: { id: DEFAULT_CLUB_ID },
      tenantBlocked: false,
    };
    const authError = await new Promise(resolve => auth(sessionReq, {}, resolve));
    assert.equal(authError, undefined);
  }
});

test('account creation rejects missing or weak permanent passwords', async () => {
  const actor = { id: 'player-test-admin', role: 'admin' };
  const req = { user: actor, club: { id: DEFAULT_CLUB_ID }, headers: {}, ip: '127.0.0.1' };
  const body = { first_name: 'Morgan', last_name: 'Password', email: 'password-player@example.test' };
  await assert.rejects(accounts.createAccount(actor, 'player', body, req), error => error.status === 422 && !!error.fields.password);
  await assert.rejects(accounts.createAccount(actor, 'player', { ...body, password: 'short' }, req), error => error.status === 422 && !!error.fields.password);
});

test.after(() => db.close());
