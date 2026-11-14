const test = require('node:test'); const assert = require('node:assert');
const rating = require('../services/rating'); const bracket = require('../services/bracket'); const u = require('../utils'); const tz = require('../../config/timezone');
const booking = require('../services/booking'); const site = require('../services/site'); const accounts = require('../services/accounts'); const a = require('../services/authlogic');
test('rating: winner gains, loser loses, equal players move by half of K', () => {
  const r = rating.newRatings(3.0, 3.0, true); assert.equal(r.a, 3.05); assert.equal(r.b, 2.95);
  const up = rating.newRatings(3.0, 4.0, true); assert.ok(up.a - 3.0 > 0.05, 'upset wins give more');
  assert.equal(rating.levelFor(2.4), 'beginner'); assert.equal(rating.levelFor(3.2), 'intermediate'); assert.equal(rating.levelFor(4.5), 'advanced'); assert.equal(rating.levelFor(5.1), 'pro');
});
test('bracket: seed order puts 1 vs 2 in opposite halves', () => {
  assert.deepEqual(bracket.seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]); assert.equal(bracket.nextPow2(5), 8);
});
test('bracket: games go to 11 and are won by 2', () => {
  assert.ok(bracket.validGame(11, 9)); assert.ok(bracket.validGame(11, 0)); assert.ok(bracket.validGame(13, 11));
  assert.ok(!bracket.validGame(11, 10)); assert.ok(!bracket.validGame(10, 8)); assert.ok(!bracket.validGame(14, 11)); assert.ok(!bracket.validGame(12, 10) === false);
});
test('phone, name, email and age rules', () => {
  assert.equal(u.normalizeMobile('0917 123 4567'), '09171234567'); assert.equal(u.normalizeMobile('+63 917 123 4567'), '09171234567'); assert.equal(u.normalizeMobile('12345'), null);
  assert.ok(u.isName('Maria Santos')); assert.ok(!u.isName('R2D2')); assert.ok(u.isEmail('a@b.co')); assert.ok(!u.isEmail('nope'));
  assert.equal(u.ageFromBirthdate('2000-01-01') >= 25, true); assert.equal(u.ageFromBirthdate(null), null);
  assert.ok(u.tempPassword().length >= 12); assert.notEqual(u.tempPassword(), u.tempPassword());
});
test('password policy', () => { assert.ok(a.passwordProblem('short1')); assert.ok(a.passwordProblem('longpasswordonly')); assert.equal(a.passwordProblem('Good1234'), null); });
test('timezone: Manila is UTC+8 and schedule line shows date, time, court', () => {
  const s = tz.manilaToUtc('2026-03-14', '17:00'); assert.equal(s.toISOString(), '2026-03-14T09:00:00.000Z'); assert.equal(tz.manilaDate(s), '2026-03-14'); assert.equal(tz.manilaHour(s), 17);
  const line = tz.scheduleLine(s, new Date(s.getTime() + 7200000), { name: 'Court 2 - Indoor', court_number: 2 }); assert.match(line, /Sat, 14 Mar 2026/); assert.match(line, /5:00 PM - 7:00 PM/); assert.match(line, /Court 2 - Indoor \(Court 2\)/);
  assert.equal(tz.peso(500), 'PHP 500.00');
});
test('booking: peak and off-peak price, weekend all day peak', () => {
  const court = { peak_start: '17:00:00', peak_end: '21:00:00', peak_rate: 400, offpeak_rate: 300, weekend_all_day_peak: true };
  assert.equal(booking.hourRate(court, tz.manilaToUtc('2026-03-16', '10:00')), 300); // Monday morning
  assert.equal(booking.hourRate(court, tz.manilaToUtc('2026-03-16', '18:00')), 400); // Monday evening
  assert.equal(booking.hourRate(court, tz.manilaToUtc('2026-03-14', '08:00')), 400); // Saturday all day
});
test('site designer: valid design passes, scripts and bad colours are rejected', () => {
  const ok = site.validate(JSON.parse(JSON.stringify(site.DEFAULT_CONFIG))); assert.equal(ok.template, 'classic');
  const bad = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); bad.sections[0].content.title = '<script>alert(1)</script>Hi'; const clean = site.validate(bad); assert.ok(!clean.sections[0].content.title.includes('<'));
  const c2 = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); c2.theme.primary = '#EEEEEE'; assert.throws(() => site.validate(c2), /too light/);
  const c3 = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); c3.theme.primary = 'red'; assert.throws(() => site.validate(c3));
  const c4 = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); c4.sections[0].content.image = 'http://evil.example/x.png'; assert.throws(() => site.validate(c4));
  const c5 = JSON.parse(JSON.stringify(site.DEFAULT_CONFIG)); c5.social.facebook = 'javascript:alert(1)'; assert.throws(() => site.validate(c5));
});
test('accounts: minors need a guardian; creating a super_admin is always refused', async () => {
  const e = accounts.validate('player', { first_name: 'Ana', last_name: 'Cruz', mobile: '09171234567', birthdate: '2015-01-01' }); assert.ok(e.guardian_name);
  assert.ok(accounts.validate('staff', { first_name: 'A', last_name: 'B', mobile: '09171234567' }).email, 'team accounts need an email');
  await assert.rejects(accounts.createAccount({ id: 'x', role: 'super_admin' }, 'super_admin', {}, {}), e2 => e2.status === 403);
  await assert.rejects(accounts.createAccount({ id: 'x', role: 'admin' }, 'admin', {}, {}), e2 => e2.status === 403); // admin cannot create admin
  await assert.rejects(accounts.createAccount({ id: 'x', role: 'staff' }, 'staff', {}, {}), e2 => e2.status === 403); // staff cannot create staff
});
