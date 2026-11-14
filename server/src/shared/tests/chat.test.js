process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { migrate } = require('../../scripts/migrate');
migrate();
const { query } = require('../../config/db');
const { seedDemo } = require('../../scripts/seed');
const chat = require('../../modules/chat/features/messages/service');
const session = require('../services/session');

test('chat enforces role-specific contacts and keeps one-to-one messages participant-scoped', async () => {
  await seedDemo();
  const { rows: [admin] } = await query("SELECT id, role, club_id FROM users WHERE email='admin@dinknest.test'");
  const { rows: [staff] } = await query("SELECT id, role, club_id FROM users WHERE email='staff@dinknest.test'");
  const { rows: [coach] } = await query("SELECT id, role, club_id FROM users WHERE email='coach@dinknest.test'");
  const { rows: [player] } = await query("SELECT id, role, club_id FROM users WHERE email='player1@dinknest.test'");
  const secondClubId = randomUUID();
  const secondClubPlayerId = randomUUID();
  const secondClubAdminId = randomUUID();
  const superAdminId = randomUUID();
  await query("INSERT INTO clubs (id, name, slug, status) VALUES ($1,'Second Club','second-club','active')", [secondClubId]);
  await query("INSERT INTO users (id, club_id, role, email, status) VALUES ($1,$2,'player','cross-club@dinknest.test','active')", [secondClubPlayerId, secondClubId]);
  await query("INSERT INTO players (club_id, user_id, first_name, last_name, status) VALUES ($1,$2,'Ariella','Across','active')", [secondClubId, secondClubPlayerId]);
  await query("INSERT INTO users (id, club_id, role, email, status) VALUES ($1,$2,'admin','second-admin@dinknest.test','active')", [secondClubAdminId, secondClubId]);
  await query("INSERT INTO staff_profiles (club_id, user_id, first_name, last_name, club_name, position_title) VALUES ($1,$2,'Terry','Owner','Second Club','Owner')", [secondClubId, secondClubAdminId]);
  await query("INSERT INTO users (id, role, email, status) VALUES ($1,'super_admin','support@dinknest.test','active')", [superAdminId]);
  const superAdmin = { id: superAdminId, role: 'super_admin', club_id: null };

  const app = require('../../app').createApp();
  const modules = require('../../modules/loader').registry;
  const chatModule = modules.find(module => module.key === 'chat.messages');
  assert.ok(chatModule);
  assert.deepEqual(chatModule.roles, ['admin', 'staff', 'coach_referee', 'player', 'super_admin']);

  const adminDirectory = await chat.searchUsers(admin, '');
  assert.ok(adminDirectory.every(person => person.club_name === 'Default Club' || person.role === 'super_admin'));
  assert.deepEqual(new Set(adminDirectory.map(person => person.role)), new Set(['super_admin', 'staff', 'coach_referee', 'player']));
  assert.deepEqual(await chat.searchUsers(admin, 'Ariella'), []);
  assert.deepEqual(new Set((await chat.searchUsers(staff, '')).map(person => person.role)), new Set(['admin', 'player', 'coach_referee']));
  assert.deepEqual(new Set((await chat.searchUsers(player, '')).map(person => person.role)), new Set(['staff', 'coach_referee']));
  assert.deepEqual(new Set((await chat.searchUsers(coach, '')).map(person => person.role)), new Set(['admin', 'staff']));
  const superAdminDirectory = await chat.searchUsers(superAdmin, '');
  assert.deepEqual(new Set(superAdminDirectory.map(person => person.role)), new Set(['admin']));
  assert.ok(superAdminDirectory.some(person => person.club_name === 'Second Club'));

  const first = await chat.createConversation(admin, player.id);
  const duplicate = await chat.createConversation(admin, player.id);
  assert.equal(first.id, duplicate.id);
  const sent = await chat.sendMessage({ user: { ...admin, clubId: admin.club_id } }, first.id, '<script>unsafe()</script>Hello');
  assert.equal(sent.body.includes('<script>'), false);
  assert.equal((await query('SELECT club_id, user_id, body FROM notifications WHERE kind=$1 ORDER BY created_at DESC LIMIT 1', ['chat'])).rows[0].club_id, admin.club_id);
  assert.equal((await chat.listConversations(player.id))[0].unread_count, 1);
  assert.equal((await chat.listMessages(player.id, first.id))[0].body, sent.body);
  assert.equal((await chat.listConversations(player.id))[0].unread_count, 0);

  const supportConversation = await chat.createConversation(admin, superAdminId);
  const supportMessage = await chat.sendMessage(
    { user: { ...admin, clubId: admin.club_id } },
    supportConversation.id,
    'Can you help me?',
  );
  assert.equal(supportMessage.body, 'Can you help me?');
  const { rows: [supportNotification] } = await query(
    "SELECT club_id, user_id, kind FROM notifications WHERE user_id=$1 AND kind='chat' ORDER BY created_at DESC LIMIT 1",
    [superAdminId],
  );
  assert.equal(supportNotification.club_id, admin.club_id);
  assert.equal(supportNotification.kind, 'chat');

  const superAdminConversation = await chat.createConversation(superAdmin, admin.id);
  assert.equal(superAdminConversation.id, supportConversation.id);
  for (const [sender, recipient] of [
    [staff, admin], [staff, player], [staff, coach],
    [player, staff], [player, coach],
    [coach, admin], [coach, staff],
  ]) {
    assert.ok((await chat.createConversation(sender, recipient.id)).id);
  }
  await assert.rejects(chat.createConversation(staff, superAdminId), error => error.code === 'CHAT_NOT_ALLOWED');
  await assert.rejects(chat.createConversation(player, admin.id), error => error.code === 'CHAT_NOT_ALLOWED');
  await assert.rejects(chat.createConversation(coach, player.id), error => error.code === 'CHAT_NOT_ALLOWED');
  await assert.rejects(chat.createConversation(staff, secondClubPlayerId), error => error.code === 'CHAT_NOT_ALLOWED');
  await assert.rejects(chat.createConversation(superAdmin, staff.id), error => error.code === 'CHAT_NOT_ALLOWED');
  await assert.rejects(chat.createConversation(admin, secondClubPlayerId), error => error.code === 'CHAT_NOT_ALLOWED');

  await assert.rejects(chat.listMessages(staff.id, first.id), error => error.code === 'CONVERSATION_NOT_FOUND');
  await assert.rejects(chat.sendMessage({ user: staff }, first.id, 'Not a participant'), error => error.code === 'CONVERSATION_NOT_FOUND');
  await assert.rejects(chat.sendMessage({ user: admin }, first.id, 'x'.repeat(2001)), error => error.code === 'INVALID_MESSAGE');

  const adminSession = await session.create(admin, { headers: {} });
  const staffSession = await session.create(staff, { headers: {} });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = async (token, method, path, body) => fetch(`${origin}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const listResponse = await request(adminSession.token, 'GET', '/api/chat/messages/conversations');
    assert.equal(listResponse.status, 200);
    const contactsResponse = await request(adminSession.token, 'GET', '/api/chat/messages/users');
    assert.equal(contactsResponse.status, 200);
    assert.ok((await contactsResponse.json()).every(person =>
      person.club_name === 'Default Club' || person.role === 'super_admin'));
    const createdResponse = await request(adminSession.token, 'POST', '/api/chat/messages/conversations', { userId: staff.id });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    const sentResponse = await request(adminSession.token, 'POST', `/api/chat/messages/conversations/${created.id}/messages`, { body: 'Runtime route check' });
    assert.equal(sentResponse.status, 201);
    const receivedResponse = await request(staffSession.token, 'GET', `/api/chat/messages/conversations/${created.id}/messages`);
    assert.equal(receivedResponse.status, 200);
    assert.equal((await receivedResponse.json()).at(-1).body, 'Runtime route check');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await session.revoke(adminSession.sessionId);
    await session.revoke(staffSession.sessionId);
  }
});
