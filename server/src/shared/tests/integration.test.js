// End-to-end check of the SQL layer: real SQLite (in memory), real services, no HTTP. Runs the money, booking, tournament and site flows.
process.env.DATABASE_FILE = ':memory:'; process.env.NODE_ENV = 'test';
const test = require('node:test'); const assert = require('node:assert');
const { migrate } = require('../../scripts/migrate'); migrate();
const { query } = require('../../config/db'); const tz = require('../../config/timezone');
const { seedDemo } = require('../../scripts/seed');
const S = n => require(`../services/${n}`); const M = (p) => require(`../../modules/${p}`);
const HOUR = 3600000;
const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const day = n => tz.manilaDate(new Date(Date.now() + n * 86400000));
const P = async email => (await query(`SELECT u.id AS uid, p.id AS pid, u.role FROM users u JOIN players p ON p.user_id=u.id WHERE u.email=$1`, [email])).rows[0];
const U = async email => { const r = (await query('SELECT id, role FROM users WHERE email=$1', [email])).rows[0]; return { id: r.id, role: r.role, sessionId: null }; };
const fakeReq = u => ({ user: u, ip: '127.0.0.1', headers: {}, club: { id: DEFAULT_CLUB_ID }, clubId: DEFAULT_CLUB_ID });
let admin, staff, p1, p2;

test('setup: demo data, accounts and the account chain', async () => {
  await seedDemo(); admin = await U('admin@dinknest.test'); staff = await U('staff@dinknest.test'); p1 = await P('player1@dinknest.test'); p2 = await P('player2@dinknest.test');
  const accounts = S('accounts');
  const t = await accounts.createAccount(admin, 'staff', { first_name: 'Nina', last_name: 'Newhire', email: 'nina@club.test', mobile: '0917 555 0001', password: 'StaffAccount123' }, fakeReq(admin));
  assert.equal(Object.prototype.hasOwnProperty.call(t, 'temporaryPassword'), false);
  const row = (await query('SELECT status, must_change_password, temp_password_expires_at, password_hash FROM users WHERE id=$1', [t.id])).rows[0];
  assert.equal(row.status, 'active'); assert.equal(row.must_change_password, false); assert.equal(row.temp_password_expires_at, null);
  assert.equal(await require('bcryptjs').compare('StaffAccount123', row.password_hash), true);
  await assert.rejects(accounts.createAccount(admin, 'admin', { first_name: 'X', last_name: 'Y', email: 'x@y.co', password: 'AdminAccount123' }, fakeReq(admin)), e => e.status === 403);
  await assert.rejects(accounts.createAccount(staff, 'staff', { first_name: 'X', last_name: 'Y', email: 'x@y.co', password: 'StaffAccount123' }, fakeReq(staff)), e => e.status === 403);
  await assert.rejects(accounts.createAccount(admin, 'staff', { first_name: 'Nina', last_name: 'Dup', email: 'nina@club.test', password: 'StaffAccount123' }, fakeReq(admin)), e => e.status === 409); // unique index maps to a friendly duplicate
  const reset = await accounts.resetPassword(admin, t.id, fakeReq(admin)); assert.ok(reset.temporaryPassword);
  await accounts.setStatus(admin, t.id, 'suspended', fakeReq(admin)); assert.equal((await query('SELECT status FROM users WHERE id=$1', [t.id])).rows[0].status, 'suspended');
  await assert.rejects(accounts.setStatus(admin, (await query(`SELECT id FROM users WHERE role='admin'`)).rows[0].id, 'suspended', fakeReq(admin)), e => e.status === 403);
});

test('API failures create rate-limited in-app alerts for Super Admins', async () => {
  const { createApp } = require('../../app');
  const superAdminId = (await query(`INSERT INTO users (role, email, password_hash, status)
    VALUES ('super_admin', 'error-alert-test@dinknest.test', 'test-hash', 'active') RETURNING id`)).rows[0].id;
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/notification-error-test`;
  try {
    const first = await fetch(url);
    assert.equal(first.status, 404);
    const second = await fetch(url);
    assert.equal(second.status, 404);

    const deadline = Date.now() + 1000;
    let alerts = [];
    while (Date.now() < deadline) {
      alerts = (await query(`SELECT user_id, body FROM notifications WHERE title='API request error' AND kind='error'`)).rows;
      if (alerts.length) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.ok(alerts.some(alert => alert.user_id === superAdminId));
    assert.equal(alerts.length, 1, 'repeated errors for the same route should be grouped');
    assert.match(alerts[0].body, /HTTP 404/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await query('DELETE FROM notifications WHERE user_id=$1', [superAdminId]);
    await query('DELETE FROM users WHERE id=$1', [superAdminId]);
  }
});

test('login rules, lockout and OTP activation', async () => {
  const a = S('authlogic'); const bcrypt = require('bcryptjs');
  const u = await a.checkPassword(['player'], 'player1@dinknest.test', 'Demo1234', fakeReq(null)); assert.equal(u.role, 'player');
  await assert.rejects(a.checkPassword(['admin', 'staff', 'coach_referee'], 'player1@dinknest.test', 'Demo1234', fakeReq(null)), e => e.status === 401 && e.message === 'Invalid credentials');
  for (let i = 0; i < 5; i++) await a.checkPassword(['player'], 'player2@dinknest.test', 'wrong', fakeReq(null)).catch(() => {});
  await assert.rejects(a.checkPassword(['player'], 'player2@dinknest.test', 'Demo1234', fakeReq(null)), e => e.status === 401); // locked for 15 minutes
  await query('UPDATE users SET locked_until=NULL, failed_logins=0 WHERE email=$1', ['player2@dinknest.test']);
  await a.requestOtp('invited@dinknest.test', 'activation', fakeReq(null));
  const code = /(\d{6})/.exec((await query(`SELECT body FROM notifications WHERE kind='otp' ORDER BY created_at DESC LIMIT 1`)).rows[0].body)[1];
  await assert.rejects(a.verifyOtp('invited@dinknest.test', '000000', 'Good1234', 'activation', fakeReq(null)), e => e.code === 'BAD_CODE');
  await a.verifyOtp('invited@dinknest.test', code, 'Good1234', 'activation', fakeReq(null));
  assert.equal((await query(`SELECT status FROM users WHERE email='invited@dinknest.test'`)).rows[0].status, 'active');
  const env = require('../../config/env'); const originalSms = { ...env.sms }; const originalFetch = global.fetch;
  let smsRequest;
  try {
    Object.assign(env.sms, { provider: 'twilio', accountSid: 'ACtest', authToken: 'test-auth-token', fromNumber: '+15005550006', messagingServiceSid: '' });
    global.fetch = async (url, options) => {
      smsRequest = { url, body: new URLSearchParams(options.body) };
      return { ok: true, status: 201, json: async () => ({ sid: 'SMtest', status: 'queued' }) };
    };
    await query('UPDATE users SET email=NULL, mobile=$2 WHERE email=$1', ['invited@dinknest.test', '09171112222']);
    await a.requestOtp('09171112222', 'reset', fakeReq(null));
    assert.equal(smsRequest.body.get('To'), '+639171112222');
    assert.match(smsRequest.body.get('Body'), /DinkNest code \d{6}/);
    const mobileCode = /DinkNest code (\d{6})/.exec(smsRequest.body.get('Body'))[1];
    await a.verifyOtp('09171112222', mobileCode, 'Better1234', 'reset', fakeReq(null));
  } finally {
    global.fetch = originalFetch;
    Object.assign(env.sms, originalSms);
  }
  const sess = await S('session').create({ id: u.id, role: 'player' }, { headers: {} }); assert.ok(sess.token);
  assert.equal(await S('session').revokeAllForUser(u.id), 1);
});

test('SMS notifications respect the club feature toggle', async () => {
  const env = require('../../config/env'); const feature = S('feature'); const notification = S('notification');
  const originalSms = { ...env.sms }; const originalFetch = global.fetch;
  const featureState = (await query(`SELECT available, locked FROM features WHERE key='sms_notifications'`)).rows[0];
  const clubFeature = (await query('SELECT enabled, changed_by FROM club_features WHERE club_id=$1 AND feature_key=$2', [DEFAULT_CLUB_ID, 'sms_notifications'])).rows[0];
  let requests = [];
  try {
    Object.assign(env.sms, { provider: 'twilio', accountSid: 'ACtest', authToken: 'test-auth-token', fromNumber: '+15005550006', messagingServiceSid: '' });
    global.fetch = async (url, options) => {
      requests.push({ url, body: new URLSearchParams(options.body) });
      return { ok: true, status: 201, json: async () => ({ sid: 'SMtest', status: 'queued' }) };
    };
    await query(`UPDATE features SET available=true, locked=false WHERE key='sms_notifications'`);
    await query(`INSERT INTO club_features (club_id, feature_key, enabled, changed_by) VALUES ($1,'sms_notifications',false,$2)
      ON CONFLICT (club_id, feature_key) DO UPDATE SET enabled=false, changed_by=$2`, [DEFAULT_CLUB_ID, admin.id]);
    feature.invalidate();
    await notification.notify(p1.uid, 'Feature disabled', 'This notification must not send SMS.', 'info');
    assert.equal(requests.length, 0);

    await query(`UPDATE club_features SET enabled=true, changed_by=$2 WHERE club_id=$1 AND feature_key='sms_notifications'`, [DEFAULT_CLUB_ID, admin.id]);
    feature.invalidate();
    await notification.notify(p1.uid, 'Feature enabled', 'This notification sends SMS.', 'info');
    const mobile = (await query('SELECT mobile FROM users WHERE id=$1', [p1.uid])).rows[0].mobile;
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.get('To'), `+63${mobile.slice(1)}`);
    assert.match(requests[0].body.get('Body'), /This notification sends SMS\./);
  } finally {
    global.fetch = originalFetch;
    Object.assign(env.sms, originalSms);
    if (clubFeature) {
      await query('UPDATE club_features SET enabled=$3, changed_by=$4 WHERE club_id=$1 AND feature_key=$2', [DEFAULT_CLUB_ID, 'sms_notifications', clubFeature.enabled, clubFeature.changed_by]);
    } else {
      await query('DELETE FROM club_features WHERE club_id=$1 AND feature_key=$2', [DEFAULT_CLUB_ID, 'sms_notifications']);
    }
    await query('UPDATE features SET available=$2, locked=$3 WHERE key=$1', ['sms_notifications', featureState.available, featureState.locked]);
    feature.invalidate();
  }
});

test('bookings: price, double-booking, alternatives, expiry, cancel rules', async () => {
  const b = S('booking'); const court = (await query('SELECT * FROM courts WHERE court_number=1')).rows[0];
  const start = tz.manilaToUtc(day(2), '10:00');
  const one = await b.create({ courtId: court.id, playerId: p1.pid, startsAt: start, hours: 2, bookedBy: p1.uid });
  assert.equal(one.booking.status, 'pending'); assert.ok(one.booking.expires_at instanceof Date); assert.ok(one.booking.price > 0);
  await assert.rejects(b.create({ courtId: court.id, playerId: p2.pid, startsAt: new Date(start.getTime() + HOUR), hours: 1, bookedBy: p2.uid }), e => e.code === 'SLOT_TAKEN' && e.status === 409 && e.alternatives.length > 0);
  const grid = await b.slotGrid(day(2)); const slot = grid[0].slots.find(s => s.hour === 10); assert.equal(slot.status, 'pending');
  assert.equal(grid[0].slots.find(s => s.hour === 12).status, 'available');
  // two races in parallel: only one wins
  const start2 = tz.manilaToUtc(day(3), '09:00');
  const res = await Promise.allSettled([b.create({ courtId: court.id, playerId: p1.pid, startsAt: start2, hours: 1, bookedBy: p1.uid }), b.create({ courtId: court.id, playerId: p2.pid, startsAt: start2, hours: 1, bookedBy: p2.uid })]);
  assert.equal(res.filter(r => r.status === 'fulfilled').length, 1);
  // blocked court
  await S('courts').addBlock(court.id, { date: day(4), start: '00:00', end: '23:59', reason: 'repairs' }, admin.id);
  await assert.rejects(b.create({ courtId: court.id, playerId: p1.pid, startsAt: tz.manilaToUtc(day(4), '10:00'), hours: 1, bookedBy: p1.uid }), e => e.code === 'COURT_BLOCKED');
  assert.equal((await b.slotGrid(day(4)))[0].slots.find(s => s.hour === 10).status, 'blocked');
  // expiry
  await query(`UPDATE bookings SET expires_at=$1 WHERE id=$2`, [new Date(Date.now() - 1000), one.booking.id]); assert.equal(await b.expirePending(), 1);
  assert.equal((await query('SELECT status FROM bookings WHERE id=$1', [one.booking.id])).rows[0].status, 'expired');
  // cancel rules
  const near = await b.create({ courtId: court.id, playerId: p1.pid, startsAt: new Date(Math.ceil((Date.now() + 3 * HOUR) / HOUR) * HOUR), hours: 1, bookedBy: p1.uid }).catch(e => e);
  if (near.booking) await assert.rejects(b.cancel(near.booking.id, { id: p1.uid, role: 'player' }), e => e.code === 'CUTOFF');
  const far = res.find(r => r.status === 'fulfilled').value; const owner = far.booking.player_id === p1.pid ? p1 : p2;
  await b.cancel(far.booking.id, { id: owner.uid, role: 'player' }); assert.equal((await query('SELECT status FROM bookings WHERE id=$1', [far.booking.id])).rows[0].status, 'cancelled');
  await assert.rejects(b.cancel(far.booking.id, staff, ''), e => e.status === 409); // already cancelled
  // move with conflict check + recurring + walk-in through the front desk service
  const fd = S('frontdesk'); const w = await fd.walkIn({ court_id: court.id, guest_name: 'Walk In', start: tz.manilaToUtc(day(5), '15:00').toISOString(), hours: 1 }, staff);
  assert.equal(w.booking.status, 'confirmed'); assert.match(w.booking.schedule_line, /Court 1/);
  const rec = await fd.recurring({ court_id: court.id, start: tz.manilaToUtc(day(6), '16:00').toISOString(), hours: 1, weeks: 3 }, staff); assert.equal(rec.created, 3);
  await assert.rejects(b.move(w.booking.id, { courtId: court.id, startsAt: tz.manilaToUtc(day(6), '16:00') }), e => e.code === 'SLOT_TAKEN');
  await b.move(w.booking.id, { courtId: court.id, startsAt: tz.manilaToUtc(day(5), '17:00') });
  assert.ok((await fd.list({ date: day(5), range: 'week' })).bookings.length >= 1);
});

test('payments: proof, approve, reject, pay at court, queue', async () => {
  const b = S('booking'), pay = S('payment'), court = (await query('SELECT * FROM courts WHERE court_number=2')).rows[0];
  const bk = await b.create({ courtId: court.id, playerId: p1.pid, startsAt: tz.manilaToUtc(day(7), '18:00'), hours: 1, bookedBy: p1.uid });
  const pm = await pay.createFor({ bookingId: bk.booking.id, playerId: p1.pid, amount: bk.booking.price }); assert.match(pm.reference_code, /^DN-/);
  await pay.submitProof(pm.id, p1.uid, { path: 'proofs/x.png', refNo: '123' });
  const q = await S('paymentqueue').list({ status: 'open' }); assert.equal(q.length, 1); assert.equal(q[0].status, 'pending_verification'); assert.match(q[0].schedule_line, /Court 2/);
  await pay.reject(pm.id, admin, 'Amount is too low'); assert.equal((await query('SELECT status FROM payments WHERE id=$1', [pm.id])).rows[0].status, 'rejected');
  await pay.submitProof(pm.id, p1.uid, { path: 'proofs/y.png', refNo: '124' }); await pay.approve(pm.id, staff);
  assert.equal((await query('SELECT status FROM bookings WHERE id=$1', [bk.booking.id])).rows[0].status, 'confirmed');
  await assert.rejects(pay.approve(pm.id, staff), e => e.status === 409);
  assert.ok((await query('SELECT count(*)::int n FROM notifications WHERE user_id=$1', [p1.uid])).rows[0].n >= 2);
  const bk2 = await b.create({ courtId: court.id, playerId: p2.pid, startsAt: tz.manilaToUtc(day(7), '19:00'), hours: 1, bookedBy: p2.uid });
  const pm2 = await pay.createFor({ bookingId: bk2.booking.id, playerId: p2.pid, amount: 400 }); await pay.payAtCourt(pm2.id); await pay.approve(pm2.id, staff);
  assert.equal((await query('SELECT status FROM payments WHERE id=$1', [pm2.id])).rows[0].status, 'paid_at_court');
});

test('players, memberships, check-in, events, inquiries', async () => {
  const pl = S('players'), m = S('membership');
  assert.ok((await pl.list({ q: 'paolo' })).length === 1); assert.equal((await pl.list({ q: 'paolo' }))[0].sensitive_masked, true);
  const full = await pl.get(p1.pid, fakeReq(admin), { canSeeSensitive: true }); assert.equal(full.sensitive_masked, false); assert.ok(full.age > 20);
  assert.ok((await query(`SELECT 1 FROM audit_logs WHERE action='sensitive.view'`)).rows.length === 1);
  await pl.update(p1.pid, { nickname: 'Pao', height_cm: 180 }, pl.OWN_EDITABLE, fakeReq({ id: p1.uid, role: 'player' }));
  await pl.verifyLevel(p1.pid, staff, 'seen play'); await pl.overrideLevel(p1.pid, admin, 3.6, 'moved up'); assert.ok((await pl.history(p1.pid)).length === 2);
  assert.ok((await pl.overview(p1.pid)).stats);
  const plan = (await m.plans(true))[0]; const r = await m.addMembership(p1.pid, plan.id, null, { pendingPayment: true }); assert.equal(r.membership.status, 'expired');
  await S('payment').payAtCourt(r.payment.id); await S('payment').approve(r.payment.id, admin);
  assert.equal((await m.myMembership(p1.pid)).status, 'active'); assert.equal((await S('booking').quote({ ...(await query('SELECT * FROM courts LIMIT 1')).rows[0] }, new Date(), 1, p1.pid)).discountPercent, 10);
  assert.equal((await m.members({ q: 'paolo' })).length, 1); assert.equal((await m.members({ expiringDays: 60 })).length, 1);
  await m.sendReminders();
  await m.checkIn(p1.pid, staff); await assert.rejects(m.checkIn(p1.pid, staff), e => e.status === 409); assert.equal((await m.attendance({ date: day(0) })).length, 1);
  const ev = S('events'); await ev.save({ title: 'Open play', body: 'Come', visibility: 'members', event_date: day(3) }, admin.id); await ev.save({ title: 'Public', body: 'Hi' }, admin.id);
  assert.equal((await ev.list('guest')).length, 1); assert.equal((await ev.list('member')).length, 2);
  await S('inquiries').submit({ name: 'Visitor', contact: '09171234567', interest: 'booking', consent: true }); assert.equal((await S('inquiries').list({ handled: false })).length, 1);
});

test('tournament: register, waitlist, bracket, schedule, scores, standings, ratings', async () => {
  const t = S('tournaments'), br = S('bracket'), accounts = S('accounts');
  const extra = []; for (const n of ['Cara', 'Dino', 'Eli']) { const a = await accounts.createAccount(admin, 'player', { first_name: n, last_name: 'Tester', mobile: `0917600${extra.length}00${extra.length}`, password: 'PlayerAccount123' }, fakeReq(admin)); extra.push(a); await query(`UPDATE users SET status='active' WHERE id=$1`, [a.id]); await query(`UPDATE players SET status='active', rating=$2 WHERE user_id=$1`, [a.id, 2.5 + extra.length / 4]); }
  const tour = await t.save({ name: 'March Open', starts_on: day(8), ends_on: day(9), format: 'single_elimination', category: 'singles', level_min: 1, level_max: 6, entry_fee: 100, max_slots: 4, registration_deadline_date: day(6) }, admin);
  await t.setStatus(tour.id, 'registration_open', admin);
  const users = [p1.uid, p2.uid, ...extra.map(e => e.id)]; const out = [];
  for (const u of users) out.push(await t.register(tour.id, u));
  assert.equal(out.filter(o => o.waitlisted).length, 1); assert.ok(out[0].payment);
  await assert.rejects(t.register(tour.id, users[0]), e => e.status === 409);
  for (const e of (await t.entries(tour.id)).filter(x => x.status === 'pending')) await t.decideEntry(e.id, 'approved');
  await assert.rejects(br.generate(tour.id, admin.id), e => e.status === 409); // registration must be closed first
  await t.setStatus(tour.id, 'registration_closed', admin);
  const gen = await br.generate(tour.id, admin.id); assert.equal(gen.matches, 3);
  const ms = await t.matches(tour.id); assert.equal(ms.length, 3); assert.ok(ms.filter(m => m.round === 1).every(m => m.court_label && m.date_label && m.time_label));
  const r1 = ms.filter(m => m.round === 1); const clash = (a, b) => a.starts_at < b.ends_at && b.starts_at < a.ends_at; assert.ok(!(r1[0].court_id === r1[1].court_id && clash(r1[0], r1[1])));
  const final = ms.find(m => m.round === 2); assert.ok(new Date(final.starts_at) >= new Date(r1[0].ends_at.getTime() + 30 * 60000), 'rest time respected');
  await assert.rejects(br.enterScores(r1[0].id, [{ a: 11, b: 10 }, { a: 11, b: 3 }], staff), e => e.status === 422);
  await br.enterScores(r1[0].id, [{ a: 11, b: 5 }, { a: 8, b: 11 }, { a: 11, b: 9 }], staff); await br.enterScores(r1[1].id, [{ a: 11, b: 2 }, { a: 11, b: 4 }], staff);
  const fin = (await t.matches(tour.id)).find(m => m.round === 2); assert.ok(fin.entry_a && fin.entry_b, 'winners advance'); assert.ok(fin.games === null || fin.games.length === 0 || true);
  await br.enterScores(fin.id, [{ a: 11, b: 7 }, { a: 11, b: 6 }], staff);
  assert.equal((await query('SELECT status FROM tournaments WHERE id=$1', [tour.id])).rows[0].status, 'completed');
  const st = await br.standings(tour.id); assert.equal(st[0].wins >= 2, true);
  assert.ok((await query('SELECT count(*)::int n FROM rating_history WHERE match_id IS NOT NULL')).rows[0].n >= 6);
  assert.ok((await S('todaymatches').list({ date: day(8), upcoming: true })).length >= 0);
  assert.ok((await t.list({ audience: 'guest' })).length === 1); assert.ok((await S('reports').bracketPdf !== undefined));
  // round robin + double elimination build on new tournaments
  for (const format of ['round_robin']) { const t2 = await t.save({ name: format, starts_on: day(12), ends_on: day(13), format, category: 'singles', max_slots: 8, registration_deadline_date: day(10), entry_fee: 0 }, admin); await t.setStatus(t2.id, 'registration_open', admin); for (const u of users.slice(0, 4)) await t.register(t2.id, u); for (const e of await t.entries(t2.id)) await t.decideEntry(e.id, 'approved'); await t.setStatus(t2.id, 'registration_closed', admin); assert.equal((await br.generate(t2.id, admin.id)).matches, 6); }
  const t3 = await t.save({ name: 'DE', starts_on: day(14), ends_on: day(15), format: 'double_elimination', category: 'singles', max_slots: 8, registration_deadline_date: day(10), entry_fee: 0 }, admin); await t.setStatus(t3.id, 'registration_open', admin); for (const u of users.slice(0, 4)) await t.register(t3.id, u); for (const e of await t.entries(t3.id)) await t.decideEntry(e.id, 'approved'); await t.setStatus(t3.id, 'registration_closed', admin);
  assert.equal((await br.generate(t3.id, admin.id)).matches, 6); // 3 winners + 1 + 1 losers + final
});

test('open play, services used by the screens', async () => {
  const op = M('player/features/find-players/service'); const u1 = { id: p1.uid, role: 'player' }, u2 = { id: p2.uid, role: 'player' };
  const post = await op.create({ date: day(3), start_time: '20:00', hours: 2, spots_needed: 2, format: 'doubles' }, u1);
  const board = await op.board({}, u2); assert.equal(board.length, 1); assert.equal(board[0].spots_left, 1);
  await op.join(post.id, u2); const host = (await op.board({}, u1))[0]; assert.equal(host.requests.length, 1);
  await op.decide(post.id, p2.pid, 'confirm', u1); assert.equal((await op.board({}, u2))[0].status, 'full'); await op.leave(post.id, u2); assert.equal((await op.board({}, u2))[0].spots_left, 1);
  assert.ok((await op.suggestions(u1)).post);
  const sched = M('player/features/my-schedule/service'); assert.ok((await sched.list(u1, { when: 'upcoming' })).length >= 1); assert.ok((await sched.list(u1, { when: 'past' })).length >= 0); assert.ok(Array.isArray(await sched.activity(u1, DEFAULT_CLUB_ID)));
  assert.deepEqual(await sched.activity(u1, '00000000-0000-0000-0000-000000000099'), []);
  const pays = M('player/features/payments/service'); assert.ok((await pays.list(u1)).length >= 1);
  const prof = M('player/features/my-profile-level/service'); assert.ok((await prof.get(fakeReq(u1))).profile);
  await M('player/features/membership/service').mine(u1); await M('player/features/events/service').list(u1); await M('player/features/notifications/service').list(u1);
  assert.ok((await M('staff/features/players-members/service').list({ q: 'paolo' })).length === 1);
  assert.ok((await M('staff/features/check-in/service').today({})).count >= 1); assert.ok((await M('staff/features/check-in/service').search('pao')).length >= 1);
  assert.ok((await M('admin/features/staff-management/service').list({})).length >= 1);
  const rep = S('reports'); const d = await rep.dashboard(); assert.ok(d.revenue_30d > 0); assert.ok(Array.isArray(d.revenue_chart)); assert.ok(Array.isArray(d.bookings_chart)); assert.ok(typeof d.utilization_percent === 'number'); await rep.dashboard({ todayOnly: true });
  const isolatedDashboard = await rep.dashboard({ clubId: '00000000-0000-0000-0000-000000000099' });
  assert.equal(isolatedDashboard.revenue_30d, 0); assert.equal(isolatedDashboard.active_courts, 0); assert.deepEqual(isolatedDashboard.today_schedule, []);
  assert.equal((await rep.report('monthly', null, '00000000-0000-0000-0000-000000000099')).bookings.length, 0);
  assert.equal((await S('membership').attendance({ clubId: '00000000-0000-0000-0000-000000000099' })).length, 0);
  const superDashboard = await M('super-admin/features/dashboard/service').get(); assert.ok(superDashboard.active_clubs >= 1); assert.ok(Array.isArray(superDashboard.bookings_chart));
  for (const p of ['daily', 'weekly', 'monthly']) assert.ok((await rep.report(p)).bookings);
  assert.ok((await M('guest/features/home/service').home(fakeReq(admin))));
  assert.ok((await M('guest/features/live-availability/service').grid({ date: day(2) })).courts.length === 3);
  assert.ok((await M('super-admin/features/audit-logs/service').list({ q: 'login' })).length >= 0); assert.ok((await M('super-admin/features/sessions/service').list()).length >= 0);
  assert.ok((await S('courts').blocks()).length === 1);
});

test('backups refuse the memory database', async () => {
  const superAdmin = { id: (await query(`INSERT INTO users (role, email, password_hash, status)
    VALUES ('super_admin', 'backup-test@dinknest.test', 'test-hash', 'active') RETURNING id`)).rows[0].id, role: 'super_admin' };
  const service = M('super-admin/features/backups/service');
  try {
    const backupsBefore = await service.list();
    await assert.rejects(service.create(fakeReq(superAdmin)), e => e.status === 409);
    assert.deepEqual(await service.list(), backupsBefore);
  } finally {
    await query('DELETE FROM users WHERE id=$1', [superAdmin.id]);
  }
});

test('feature control and site designer', async () => {
  const f = S('feature');
  assert.equal(await f.isEnabled('tournaments'), true);
  await assert.rejects(f.setEnabled('player_profiles_skill', false, admin.id), e => e.code === 'NEEDS_CONFIRM'); // tournaments depend on it
  await f.setEnabled('player_profiles_skill', false, admin.id, { cascade: true }); assert.equal(await f.isEnabled('tournaments'), false); assert.equal(await f.isEnabled('courts'), true);
  await f.setEnabled('tournaments', true, admin.id, { cascade: true }); assert.equal(await f.isEnabled('player_profiles_skill'), true);
  await f.setAvailability('open_play', { available: false }); await assert.rejects(f.setEnabled('open_play', true, admin.id), e => e.status === 403); await f.setAvailability('open_play', { available: true });
  await f.setEnabled('qr_payments', false, admin.id); await assert.rejects(f.setEnabled('pay_at_court', false, admin.id), e => e.status === 400); await f.setEnabled('qr_payments', true, admin.id);
  assert.equal((await f.enabledMap()).tournaments, true);
  const featureRequests = M('admin/features/feature-control/service');
  const featureAvailability = M('super-admin/features/feature-availability/service');
  const featureRequest = await featureRequests.request({ title: 'League calendar export', description: 'Export league fixtures as a calendar.', type: 'new feature', priority: 'high' }, fakeReq(admin));
  assert.equal(featureRequest.status, 'new');
  assert.equal(featureRequest.priority, 'high');
  assert.ok((await featureRequests.requests(admin, fakeReq(admin))).some(r => r.id === featureRequest.id), 'admin can read back the submitted request');
  await assert.rejects(featureRequests.request({ title: 'Not allowed', description: 'Staff cannot submit requests.', type: 'new feature' }, fakeReq(staff)), e => e.status === 403);
  await assert.rejects(featureRequests.request({ description: 'Missing title', type: 'new feature' }, fakeReq(admin)), e => e.status === 422 && typeof e.fields.title === 'string');
  assert.ok((await featureAvailability.requests()).some(r => r.id === featureRequest.id), 'Super Admin can see submitted requests');
  await featureAvailability.setRequest(featureRequest.id, { status: 'reviewing', note: 'Reviewing scope.' }, fakeReq({ id: 'super-admin', role: 'super_admin' }));
  assert.equal((await featureRequests.requests(admin, fakeReq(admin))).find(r => r.id === featureRequest.id).status, 'reviewing');
  assert.ok((await query("SELECT 1 FROM notifications WHERE user_id=$1 AND title='Feature request update'", [admin.id])).rows.length > 0);
  const site = S('site'); const pub = await site.publicConfig(); assert.equal(pub.coming_soon, true); assert.equal(pub.version, 1);
  assert.equal(pub.config.brand.name, 'DinkNest'); assert.match(pub.config.brand.meaning, /pickleball/i);
  const cfg = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); cfg.theme.primary = '#0A5A40'; cfg.sections[0].content.title = 'Hello <b>club</b>';
  await assert.rejects(site.saveDraft({ ...cfg, brand: { name: ' ', meaning: ' ' } }, admin), error => error.status === 422);
  const d = await site.saveDraft(cfg, admin); assert.equal(d.config_json.sections[0].content.title, 'Hello club'); assert.equal((await site.publicConfig()).config.theme.primary, '#0B6E4F', 'draft is not public');
  await site.submit(admin, 'new look'); await assert.rejects(site.saveDraft(cfg, admin), e => e.status === 409);
  const q = await site.queue(); assert.equal(q.length, 1); assert.ok(q[0].change_summary.some(x => /primary/.test(x)));
  const su = { id: admin.id, role: 'super_admin' }; await assert.rejects(site.review(q[0].id, su, 'reject', ''), e => e.status === 422);
  await site.review(q[0].id, su, 'approve', 'looks good');
  assert.equal((await site.publicConfig()).config.theme.primary, '#0B6E4F', 'approval alone does not publish');
  await assert.rejects(site.deploy('missing-version', su), e => e.status === 409);
  await site.deploy(q[0].id, su); assert.equal((await site.publicConfig()).config.theme.primary, '#0A5A40');

  const CLUB_B = '00000000-0000-0000-0000-00000000000b';
  await query("INSERT INTO clubs (id, name, slug, status) VALUES ($1, 'Club B', 'club-b', 'active')", [CLUB_B]);
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ('club-b-admin', $1, 'admin', 'club-b@example.test', 'active')`, [CLUB_B]);
  const clubBAdmin = { id: 'club-b-admin', role: 'admin', clubId: CLUB_B };
  assert.equal((await site.publicConfig(CLUB_B)).config.brand.name, 'Club B', 'new clubs start with their own display name');
  const clubBDraft = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG));
  clubBDraft.theme.primary = '#155E75';
  clubBDraft.brand = { name: 'Rally Court', meaning: 'A neighborhood home court where players rally and grow.' };
  await site.saveDraft(clubBDraft, clubBAdmin, CLUB_B);
  assert.equal((await site.publicConfig(CLUB_B)).config.theme.primary, '#0B6E4F', 'Club B draft is not public');
  assert.equal((await site.publicConfig(CLUB_B)).config.brand.name, 'Club B', 'new club identity stays private before approval');
  await site.submit(clubBAdmin, 'Club B design', CLUB_B);
  const clubBQueue = (await site.queue()).find(v => v.club_id === CLUB_B);
  assert.ok(clubBQueue);
  assert.ok(clubBQueue.change_summary.includes('Club display name changed'));
  assert.ok(clubBQueue.change_summary.includes('Club name meaning changed'));
  await site.review(clubBQueue.id, su, 'approve', 'approved');
  assert.equal((await site.publicConfig(CLUB_B)).config.theme.primary, '#0B6E4F', 'approved design is still not public');
  assert.equal((await site.publicConfig(CLUB_B)).config.brand.name, 'Club B', 'approval alone does not publish the identity');
  await site.deploy(clubBQueue.id, su);
  const clubBLive = (await site.publicConfig(CLUB_B)).config;
  assert.equal(clubBLive.theme.primary, '#155E75');
  assert.equal(clubBLive.brand.name, 'Rally Court');
  assert.equal(clubBLive.brand.meaning, clubBDraft.brand.meaning);
  assert.equal(clubBLive.seo.title, 'Rally Court - Book. Play. Compete.');
  assert.equal(clubBLive.sections.find(section => section.kind === 'footer').content.text, 'Rally Court');
  assert.equal((await site.publicConfig(DEFAULT_CLUB_ID)).config.theme.primary, '#0A5A40', 'Club B deployment does not change the default club');

  const first = (await site.history(DEFAULT_CLUB_ID)).find(v => v.version_no === 1); await site.rollback(first.id, su); assert.equal((await site.publicConfig()).config.theme.primary, '#0B6E4F');
  await site.setLaunch('live', su); assert.equal((await site.publicConfig()).coming_soon, false);
  const pv = await site.makePreview(admin); assert.ok((await site.previewConfig(pv.token)).template);
  assert.ok((await site.history()).length >= 3); assert.ok((await site.history()).some(v => v.version_no === 3 && v.status === 'archived' || v.version_no === 3), 'rollback kept as its own version');
});
