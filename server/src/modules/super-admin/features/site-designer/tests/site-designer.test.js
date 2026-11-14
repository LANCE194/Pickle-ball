process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { migrate } = require('../../../../../scripts/migrate');
const { query, db } = require('../../../../../config/db');
const { sha256 } = require('../../../../../shared/utils');
const { createApp } = require('../../../../../app');
const site = require('../../../../../shared/services/site');
const { DEFAULT_CLUB_ID } = require('../../../../../shared/services/tenant');

migrate();

test('super-admin site designer saves a previewable draft and publishes an audited live version', async () => {
  const token = 'super-admin-site-designer-api-test-token';
  const user = { id: 'site-designer-super-admin', role: 'super_admin' };
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ($1, NULL, 'super_admin', 'site-designer-super-admin@example.test', 'active')`, [user.id]);
  await query(`INSERT INTO sessions (id, club_id, user_id, role, token_hash)
    VALUES ('site-designer-api-session', $1, $2, 'super_admin', $3)`, [DEFAULT_CLUB_ID, user.id, sha256(token)]);
  const server = http.createServer(createApp());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const api = async (method, path, body) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/super-admin/site-designer${path}`, {
      method,
      headers: {
        Host: 'localhost',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    return { status: response.status, data };
  };

  try {
    const clubs = await api('GET', '/clubs');
    assert.equal(clubs.status, 200);
    assert.ok(clubs.data.some(club => club.id === DEFAULT_CLUB_ID));

    const selector = `?club_id=${DEFAULT_CLUB_ID}`;
    const draftResponse = await api('GET', `/draft${selector}`);
    assert.equal(draftResponse.status, 200);
    const config = draftResponse.data.config;
    config.brand.name = 'DinkNest Super Admin Preview';

    const saved = await api('PUT', `/draft${selector}`, { config });
    assert.equal(saved.status, 200);
    const preview = await api('POST', `/preview${selector}`);
    assert.equal(preview.status, 200);
    const previewConfig = await api('GET', `/preview/${preview.data.token}${selector}`);
    assert.equal(previewConfig.status, 200);
    assert.equal(previewConfig.data.config.brand.name, config.brand.name);

    const published = await api('POST', `/publish${selector}`);
    assert.equal(published.status, 200);
    assert.equal((await site.publicConfig(DEFAULT_CLUB_ID)).config.brand.name, config.brand.name);
    assert.ok((await query(`SELECT 1 FROM audit_logs WHERE action='site.super_admin.publish' AND user_id=$1`, [user.id])).rows.length);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('super-admin site designer does not overwrite an Admin design awaiting review', async () => {
  const user = { id: 'site-designer-super-admin', role: 'super_admin' };
  const adminId = 'site-designer-pending-admin';
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ($1, $2, 'admin', 'site-designer-pending@example.test', 'active')`, [adminId, DEFAULT_CLUB_ID]);
  const live = await site.publicConfig(DEFAULT_CLUB_ID);
  const superDraft = await site.superAdminDraft(user, DEFAULT_CLUB_ID);
  const superConfig = { ...superDraft.config_json, brand: { ...superDraft.config_json.brand, name: 'Super Admin draft only' } };
  await site.saveSuperAdminDraft(superConfig, user, DEFAULT_CLUB_ID);
  const adminDraft = await site.currentDraft(adminId, DEFAULT_CLUB_ID);
  assert.notEqual(adminDraft.id, superDraft.id);
  assert.notEqual(adminDraft.config_json.brand.name, 'Super Admin draft only');
  const { rows } = await query(`INSERT INTO site_versions (club_id, version_no, status, config_json, created_by)
    VALUES ($1, (SELECT COALESCE(MAX(version_no),0)+1 FROM site_versions WHERE club_id=$1), 'submitted', $2, $3)
    RETURNING id`, [DEFAULT_CLUB_ID, JSON.stringify(live.config), adminId]);
  try {
    const draft = await site.superAdminDraft(user, DEFAULT_CLUB_ID);
    assert.equal(draft.publish_blocked, true);
    await assert.rejects(site.publishSuperAdminDraft(user, DEFAULT_CLUB_ID), { status: 409 });
  } finally {
    await query('DELETE FROM site_versions WHERE id IN ($1,$2,$3)', [rows[0].id, superDraft.id, adminDraft.id]);
    await query('DELETE FROM users WHERE id=$1', [adminId]);
  }
});

test.after(() => db.close());
