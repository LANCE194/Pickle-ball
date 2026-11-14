process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { migrate } = require('../../../../../scripts/migrate');
const { query, db } = require('../../../../../config/db');
const { sha256 } = require('../../../../../shared/utils');
const { createApp } = require('../../../../../app');

migrate();

test('super-admin dashboard is available through the authenticated route', async () => {
  const token = 'super-admin-dashboard-api-test-token';
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ('dashboard-test-super-admin', NULL, 'super_admin', 'dashboard-super-admin@example.test', 'active')`);
  await query(`INSERT INTO sessions (id, club_id, user_id, role, token_hash)
    VALUES ('dashboard-api-test-session', $1, 'dashboard-test-super-admin', 'super_admin', $2)`,
  ['00000000-0000-0000-0000-000000000001', sha256(token)]);
  const server = http.createServer(createApp());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/super-admin/dashboard`, {
      headers: { Host: 'localhost', Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(typeof body.active_clubs, 'number');
    assert.equal(typeof body.active_admins, 'number');
    assert.ok(Array.isArray(body.bookings_chart));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test.after(() => db.close());
