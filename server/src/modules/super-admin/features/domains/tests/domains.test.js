process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.MULTICLUB_ENABLED = 'true';
process.env.DEFAULT_CLUB_HOSTS = 'default.example.test';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { migrate } = require('../../../../../scripts/migrate');
const { query, db } = require('../../../../../config/db');
const service = require('../service');
const { resolveClubFromHost, DEFAULT_CLUB_ID } = require('../../../../../shared/services/tenant');
const { sha256 } = require('../../../../../shared/utils');
const { createApp } = require('../../../../../app');

const req = { user: { id: 'domain-test-super-admin', role: 'super_admin' }, ip: '127.0.0.1' };
migrate();

test('domain lifecycle requires DNS verification and explicit HTTPS confirmation', async () => {
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ('domain-test-super-admin', NULL, 'super_admin', 'domain-admin@example.test', 'active')`);
  const created = await service.create({ clubId: DEFAULT_CLUB_ID, host: 'club.example.test' }, req);
  assert.equal(created.host, 'club.example.test');
  assert.equal(created.verification_status, 'pending');
  assert.equal(created.https_ready, false);
  assert.equal(created.txt_name, '_dinknest.club.example.test');
  assert.match(created.txt_value, /^dinknest-verification=[a-f0-9]+$/);

  await assert.rejects(service.verifyDns(created.id, req, async () => []), { code: 'DOMAIN_DNS_MISMATCH' });
  await assert.rejects(service.confirmHttpsReady(created.id, { confirmed: true }, req), { code: 'DOMAIN_NOT_VERIFIED' });
  const verified = await service.verifyDns(created.id, req, async name => {
    assert.equal(name, created.txt_name);
    return [[created.txt_value]];
  });
  assert.equal(verified.verification_status, 'verified');
  assert.equal(verified.https_ready, false);
  assert.equal((await resolveClubFromHost(created.host)), null);
  await assert.rejects(service.confirmHttpsReady(created.id, {}, req), { code: 'HTTPS_CONFIRMATION_REQUIRED' });

  const ready = await service.confirmHttpsReady(created.id, { confirmed: true }, req);
  assert.equal(ready.https_ready, true);
  assert.equal((await resolveClubFromHost(created.host)).id, DEFAULT_CLUB_ID);

  const rotated = await service.rotateChallenge(created.id, req);
  assert.notEqual(rotated.verification_token, created.verification_token);
  assert.equal(rotated.verification_status, 'pending');
  assert.equal(rotated.https_ready, false);
  assert.equal(await resolveClubFromHost(created.host), null);
  await service.disable(created.id, req);
  assert.equal(await resolveClubFromHost(created.host), null);
  const enabled = await service.enable(created.id, req);
  assert.equal(enabled.verification_status, 'pending');
  assert.equal(enabled.https_ready, false);
  assert.notEqual(enabled.verification_token, rotated.verification_token);
});

test('domain creation rejects malformed and duplicate public hosts', async () => {
  await assert.rejects(service.create({ clubId: DEFAULT_CLUB_ID, host: 'localhost' }, req), { code: 'INVALID_DOMAIN' });
  await assert.rejects(service.create({ clubId: DEFAULT_CLUB_ID, host: 'https://club.example.test/path' }, req), { code: 'INVALID_DOMAIN' });
  await service.create({ clubId: DEFAULT_CLUB_ID, host: 'unique.example.test' }, req);
  await assert.rejects(service.create({ clubId: DEFAULT_CLUB_ID, host: 'unique.example.test' }, req), { code: 'DOMAIN_IN_USE' });
});

test('domain management API routes respond through the authenticated app', async () => {
  const token = 'domain-api-test-token';
  await query(`INSERT INTO sessions (id, club_id, user_id, role, token_hash)
    VALUES ('domain-api-test-session', $1, 'domain-test-super-admin', 'super_admin', $2)`,
  [DEFAULT_CLUB_ID, sha256(token)]);
  const server = http.createServer(createApp());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const request = (method, path, body) => new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const request = http.request({
      hostname: '127.0.0.1',
      port,
      method,
      path: `/api/super-admin/domains${path}`,
      headers: {
        Host: 'default.example.test',
        Authorization: `Bearer ${token}`,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
      },
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        body: JSON.parse(Buffer.concat(chunks).toString()),
      }));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
  const verifyDns = service.verifyDns;

  try {
    const listed = await request('GET', '/');
    assert.equal(listed.status, 200);

    const created = await request('POST', '/', { clubId: DEFAULT_CLUB_ID, host: 'api.example.test' });
    assert.equal(created.status, 201);
    const domain = created.body;
    assert.equal(domain.host, 'api.example.test');

    service.verifyDns = (id, requestContext) => verifyDns(id, requestContext, async name => {
      assert.equal(name, domain.txt_name);
      return [[domain.txt_value]];
    });
    assert.equal((await request('POST', `/${domain.id}/verify-dns`)).status, 200);
    assert.equal((await request('POST', `/${domain.id}/https-ready`, { confirmed: true })).status, 200);
    assert.equal((await request('POST', `/${domain.id}/rotate-challenge`)).status, 200);
    assert.equal((await request('POST', `/${domain.id}/disable`)).status, 200);
    assert.equal((await request('POST', `/${domain.id}/enable`)).status, 200);
  } finally {
    service.verifyDns = verifyDns;
    await new Promise(resolve => server.close(resolve));
  }
});

test.after(() => db.close());
