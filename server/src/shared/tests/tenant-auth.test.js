process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.MULTICLUB_ENABLED = 'true';
process.env.DEFAULT_CLUB_HOSTS = 'default.example.test';
process.env.CLUB_SUBDOMAIN_BASE_DOMAIN = 'clubs.example.test';
process.env.CLUB_SUBDOMAIN_WILDCARD_READY = 'true';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const { migrate } = require('../../scripts/migrate');
const { query, db } = require('../../config/db');
const env = require('../../config/env');
const tenant = require('../services/tenant');
const authlogic = require('../services/authlogic');
const { auth } = require('../../middleware/auth');
const { sha256 } = require('../utils');
const gateway = require('../../realtime/gateway');
const { createApp } = require('../../app');

const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const CLUB_A = '00000000-0000-0000-0000-00000000000a';
const CLUB_B = '00000000-0000-0000-0000-00000000000b';
const PASSWORD = 'ClubPassword1';

migrate();

test('host parsing and resolution fail closed for malformed and inactive domains', async () => {
  assert.equal(tenant.normalizeHost('HTTPS://Club.Example.test:443/'), 'club.example.test');
  assert.equal(tenant.normalizeHost('club.example.test/path'), null);
  assert.equal(tenant.normalizeHost('club.example.test,other.example.test'), null);
  assert.equal(tenant.isLocalHost('[::1]:4000'), true);

  await query("INSERT INTO clubs (id, name, slug, status) VALUES ($1, 'Club A', 'club-a', 'active')", [CLUB_A]);
  await query("INSERT INTO clubs (id, name, slug, status) VALUES ($1, 'Club B', 'club-b', 'active')", [CLUB_B]);
  await query("INSERT INTO clubs (id, name, slug, status) VALUES ($1, 'Wildcard Club', 'wildcard-club', 'active')", ['00000000-0000-0000-0000-00000000000c']);
  await query(`INSERT INTO club_domains (club_id, host, verification_status, https_ready)
    VALUES ($1, 'active.example.test', 'verified', true), ($2, 'pending.example.test', 'pending', false)`, [CLUB_A, CLUB_B]);
  await query(`INSERT INTO club_domains (club_id, host, verification_status, https_ready)
    VALUES ($1, 'insecure.example.test', 'verified', false)`, [CLUB_A]);

  assert.equal((await tenant.resolveClubFromHost('active.example.test')).id, CLUB_A);
  assert.equal(await tenant.resolveClubFromHost('pending.example.test'), null);
  assert.equal(await tenant.resolveClubFromHost('insecure.example.test'), null);
  assert.equal(await tenant.resolveClubFromHost('unknown.example.test'), null);
  assert.equal((await tenant.resolveClubFromHost('default.example.test')).id, DEFAULT_CLUB_ID);
  assert.equal(tenant.clubSubdomainHost('wildcard-club'), 'wildcard-club.clubs.example.test');
  assert.equal((await tenant.resolveClubFromHost('wildcard-club.clubs.example.test')).id, '00000000-0000-0000-0000-00000000000c');
  assert.equal(await tenant.resolveClubFromHost('nested.wildcard-club.clubs.example.test'), null);
  const domains = require('../../modules/super-admin/features/domains/service');
  assert.equal((await domains.list()).clubs.find(club => club.id === '00000000-0000-0000-0000-00000000000c').website_url, 'https://wildcard-club.clubs.example.test');

  const wildcardReady = env.clubSubdomainWildcardReady;
  env.clubSubdomainWildcardReady = false;
  try {
    assert.equal(tenant.clubSubdomainHost('wildcard-club'), null);
    assert.equal(await tenant.resolveClubFromHost('wildcard-club.clubs.example.test'), null);
    assert.equal((await domains.list()).clubs.find(club => club.id === '00000000-0000-0000-0000-00000000000c').website_url, null);
  } finally {
    env.clubSubdomainWildcardReady = wildcardReady;
  }

  const isProd = env.isProd;
  env.isProd = true;
  try {
    assert.equal(await tenant.resolveClubFromHost('localhost'), null);
  } finally {
    env.isProd = isProd;
  }

  const multiClubEnabled = env.multiClubEnabled;
  env.multiClubEnabled = false;
  try {
    assert.equal(await tenant.resolveClubFromHost('active.example.test'), null);
  } finally {
    env.multiClubEnabled = multiClubEnabled;
  }

  const req = { headers: { host: 'pending.example.test' } };
  await new Promise((resolve, reject) => tenant.resolveRequestClub(req, null, error => error ? reject(error) : resolve()));
  assert.equal(req.tenantBlocked, true);
  assert.equal(req.club, null);

  const forwardedHostReq = {
    headers: { host: 'unknown.example.test', 'x-forwarded-host': 'default.example.test' },
  };
  await new Promise((resolve, reject) => tenant.resolveRequestClub(forwardedHostReq, null, error => error ? reject(error) : resolve()));
  assert.equal(forwardedHostReq.tenantBlocked, true);
});

test('login identity and bearer sessions are scoped to the resolved club', async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  await query(`INSERT INTO users (id, club_id, role, email, password_hash, status)
    VALUES ('club-user-a', $1, 'admin', 'shared@example.test', $3, 'active'),
           ('club-user-b', $2, 'admin', 'shared@example.test', $3, 'active')`, [CLUB_A, CLUB_B, passwordHash]);

  const userA = await authlogic.checkPassword(['admin'], 'shared@example.test', PASSWORD, { club: { id: CLUB_A } });
  const userB = await authlogic.checkPassword(['admin'], 'shared@example.test', PASSWORD, { club: { id: CLUB_B } });
  assert.equal(userA.id, 'club-user-a');
  assert.equal(userB.id, 'club-user-b');

  const token = 'session-token-for-club-a';
  await query(`INSERT INTO sessions (id, club_id, user_id, role, token_hash)
    VALUES ('session-a', $1, 'club-user-a', 'admin', $2)`, [CLUB_A, sha256(token)]);
  const req = {
    headers: { authorization: `Bearer ${token}` },
    query: {},
    originalUrl: '/api/auth/me',
    club: { id: CLUB_B },
    tenantBlocked: false,
  };
  await new Promise((resolve, reject) => auth(req, {}, error => error ? reject(error) : resolve()));
  assert.equal(req.user, undefined);

  req.club = { id: CLUB_A };
  await new Promise((resolve, reject) => auth(req, {}, error => error ? reject(error) : resolve()));
  assert.equal(req.user.id, 'club-user-a');
});

test('websocket upgrades resolve the host and bind sessions to that club', async () => {
  const server = http.createServer(createApp());
  gateway.attach(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const url = `ws://127.0.0.1:${address.port}/ws`;

  try {
    const requestStatus = host => new Promise((resolve, reject) => {
      http.get({ hostname: '127.0.0.1', port: address.port, path: '/api/health', headers: { Host: host } }, res => {
        res.resume();
        resolve(res.statusCode);
      }).on('error', reject);
    });
    assert.equal(await requestStatus('unknown.example.test'), 403);
    assert.equal(await requestStatus('default.example.test'), 200);

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(url, { headers: { Host: 'unknown.example.test' } });
      ws.once('open', () => reject(new Error('Unknown host unexpectedly connected')));
      ws.once('error', error => error.message.includes('403') ? resolve() : reject(error));
    });

    const token = 'session-token-for-club-a';
    const connect = host => new Promise((resolve, reject) => {
      const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`, { headers: { Host: host } });
      ws.once('message', raw => {
        ws.close();
        resolve(JSON.parse(raw.toString()).data.authenticated);
      });
      ws.once('error', reject);
    });

    assert.equal(await connect('active.example.test'), true);
    assert.equal(await connect('default.example.test'), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test.after(() => db.close());
