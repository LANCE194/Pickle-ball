const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dinknest-backups-'));
process.env.DATABASE_FILE = path.join(temp, 'dinknest.db');
process.env.STORAGE_DIR = path.join(temp, 'storage');
process.env.NODE_ENV = 'test';

const { migrate } = require('../../scripts/migrate');
migrate();
const { query, pool } = require('../../config/db');
const { seedDemo } = require('../../scripts/seed');
const backups = require('../services/backups');
const backupTransfer = require('../services/backupTransfer');
const chat = require('../../modules/chat/features/messages/service');
let adminReq;
let superAdminReq;

test('backup fixtures: admin and Super Admin', async () => {
  await seedDemo();
  const { rows: [admin] } = await query("SELECT id, role, club_id FROM users WHERE email='admin@dinknest.test'");
  const { rows: [superAdmin] } = await query(
    "INSERT INTO users (role, email, password_hash, status) VALUES ('super_admin','backup-root@dinknest.test','test-hash','active') RETURNING id, role, club_id",
  );
  adminReq = { user: { id: admin.id, role: admin.role, clubId: admin.club_id }, ip: '127.0.0.1', headers: {} };
  superAdminReq = { user: { id: superAdmin.id, role: superAdmin.role, clubId: null }, ip: '127.0.0.1', headers: {} };
});

test('Admin club backup is shared in chat and merges only its source club', async () => {
  const clubId = adminReq.user.clubId;
  await query("INSERT INTO settings (club_id, key, value) VALUES ($1,'backup_test','\"before\"')", [clubId]);
  const courtId = (await query('SELECT id FROM courts WHERE club_id=$1 LIMIT 1', [clubId])).rows[0].id;
  const assetPath = `courts/${randomUUID()}.png`;
  const assetFile = path.join(process.env.STORAGE_DIR, ...assetPath.split('/'));
  fs.mkdirSync(path.dirname(assetFile), { recursive: true });
  fs.writeFileSync(assetFile, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]));
  await query('UPDATE courts SET photo_path=$1 WHERE id=$2', [assetPath, courtId]);
  const archive = await backups.makeClubArchive(adminReq);
  assert.match(archive.name, /\.dnclub\.gz$/);
  fs.unlinkSync(assetFile);
  await query("INSERT INTO clubs (id,name,slug) VALUES ('00000000-0000-0000-0000-000000000099','Other Club','other-club')");
  await query("INSERT INTO settings (club_id, key, value) VALUES ($1,'backup_test','\"other-club\"')", ['00000000-0000-0000-0000-000000000099']);
  await query("UPDATE settings SET value='\"after\"' WHERE club_id=$1 AND key='backup_test'", [clubId]);

  const sent = await backupTransfer.sendClubBackupToSuperAdmin(adminReq, archive);
  const messages = await chat.listMessages(superAdminReq.user.id, sent.conversationId);
  const attachment = messages.find(message => message.attachment_kind === 'club_backup');
  assert.ok(attachment);
  assert.equal(attachment.attachment_name, archive.name);
  const transferred = await backupTransfer.clubBackupAttachment(superAdminReq.user, attachment.attachment_id);
  assert.deepEqual(transferred, archive.buffer);

  const result = await backups.importClub(superAdminReq, transferred);
  assert.equal(result.clubId, clubId);
  assert.ok(result.records > 0);
  assert.deepEqual(fs.readFileSync(assetFile), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]));
  assert.equal((await query("SELECT value FROM settings WHERE club_id=$1 AND key='backup_test'", [clubId])).rows[0].value, 'before');
  assert.equal((await query("SELECT value FROM settings WHERE club_id=$1 AND key='backup_test'", ['00000000-0000-0000-0000-000000000099'])).rows[0].value, 'other-club');
  await assert.rejects(backups.importClub(superAdminReq, transferred), error => error.code === 'BACKUP_ALREADY_IMPORTED');
  await assert.rejects(backups.importClub(adminReq, transferred), error => error.code === 'FORBIDDEN');
});

test('Super Admin full backup restores database and preserves a pre-restore safety backup', async () => {
  const clubId = adminReq.user.clubId;
  const assetPath = (await query('SELECT photo_path FROM courts WHERE club_id=$1 LIMIT 1', [clubId])).rows[0].photo_path;
  const assetFile = path.join(process.env.STORAGE_DIR, ...assetPath.split('/'));
  const originalAsset = fs.readFileSync(assetFile);
  const created = await backups.createFull(superAdminReq);
  const file = backups.archivePath(created.name);
  const archive = fs.readFileSync(file);
  fs.writeFileSync(assetFile, Buffer.from('changed'));
  await query("UPDATE settings SET value='\"changed-after-backup\"' WHERE club_id=$1 AND key='backup_test'", [clubId]);

  const restored = await backups.importFull(superAdminReq, archive);
  assert.equal(restored.reauthenticationRequired, true);
  assert.equal((await query("SELECT value FROM settings WHERE club_id=$1 AND key='backup_test'", [clubId])).rows[0].value, 'before');
  assert.deepEqual(fs.readFileSync(assetFile), originalAsset);
  assert.ok(fs.existsSync(backups.archivePath(restored.safetyBackup)));
  await assert.rejects(backups.createFull(adminReq), error => error.code === 'FORBIDDEN');
});

test('backup endpoints enforce roles and accept an uploaded full backup', async () => {
  const { createApp } = require('../../app');
  const sessions = require('../services/session');
  const adminSession = await sessions.create(adminReq.user, { headers: {} });
  const superAdminSession = await sessions.create(superAdminReq.user, { headers: {} });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = (token, method, url, body) => fetch(`${origin}${url}`, {
    method,
    headers: { authorization: `Bearer ${token}` },
    body,
  });
  try {
    assert.equal((await request(adminSession.token, 'POST', '/api/super-admin/backups')).status, 403);
    assert.equal((await request(superAdminSession.token, 'POST', '/api/admin/backups/export')).status, 403);
    assert.equal((await request(adminSession.token, 'POST', '/api/admin/backups/export')).status, 201);

    const sentResponse = await request(adminSession.token, 'POST', '/api/admin/backups/send');
    assert.equal(sentResponse.status, 201);
    const sent = await sentResponse.json();
    const messagesResponse = await request(superAdminSession.token, 'GET', `/api/chat/messages/conversations/${sent.conversationId}/messages`);
    assert.equal(messagesResponse.status, 200);
    const messages = await messagesResponse.json();
    const backupMessage = messages.filter(message => message.attachment_kind === 'club_backup').pop();
    assert.ok(backupMessage);
    const download = await request(superAdminSession.token, 'GET', `/api/chat/messages/attachments/${backupMessage.attachment_id}`);
    assert.equal(download.status, 200);
    const clubRestore = await request(superAdminSession.token, 'POST', `/api/super-admin/backups/import-club/${backupMessage.attachment_id}`);
    assert.equal(clubRestore.status, 200);

    const backup = await backups.createFull(superAdminReq);
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(backups.archivePath(backup.name))]), backup.name);
    const response = await request(superAdminSession.token, 'POST', '/api/super-admin/backups/import', form);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.ok(result.safetyBackup);
    assert.equal(result.reauthenticationRequired, true);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await sessions.revoke(adminSession.sessionId);
    await sessions.revoke(superAdminSession.sessionId);
  }
});

test.after(async () => {
  await pool.end();
  fs.rmSync(temp, { recursive: true, force: true });
});
