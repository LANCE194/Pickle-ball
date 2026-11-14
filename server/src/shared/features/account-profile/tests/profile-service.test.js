process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { migrate } = require('../../../../scripts/migrate');
const { query } = require('../../../../config/db');
const accountProfile = require('../service');
const coachProfile = require('../../../../modules/coach-referee/features/profile/service');

const CLUB_ID = '00000000-0000-0000-0000-000000000001';

async function addUser(id, role) {
  await query(`INSERT INTO users (id, club_id, role, email, status)
    VALUES ($1, $2, $3, $4, 'active')`, [id, CLUB_ID, role, `${id}@example.test`]);
  const table = role === 'coach_referee' ? 'referee_profiles' : 'staff_profiles';
  await query(`INSERT INTO ${table} (club_id, user_id, first_name, last_name)
    VALUES ($1, $2, 'Initial', 'Name')`, [CLUB_ID, id]);
}

test('self-service profiles update personal data and photos without changing owner-managed data', async () => {
  migrate();
  for (const role of ['admin', 'staff']) {
    const id = `profile-${role}`;
    await addUser(id, role);
    const req = { user: { id, role, sessionId: `session-${role}` }, ip: '127.0.0.1' };
    const profile = await accountProfile.update({ first_name: 'Maria', nickname: 'Mia' }, req);
    assert.equal(profile.first_name, 'Maria');
    assert.equal(profile.nickname, 'Mia');
    assert.equal(profile.role, role);
    assert.equal(Object.hasOwn(profile, 'permissions'), false);

    await assert.rejects(
      accountProfile.update({ permissions: '{"sensitive_view":true}' }, req),
      error => error.status === 422 && !!error.fields.permissions,
    );
    const photo = await accountProfile.photo(req.user, { path: `profiles/${id}.png` }, req);
    assert.equal(photo.photo_path, `profiles/${id}.png`);
  }

  const coachId = 'profile-coach';
  await addUser(coachId, 'coach_referee');
  const coachReq = { user: { id: coachId, role: 'coach_referee', sessionId: 'session-coach' }, ip: '127.0.0.1' };
  const coach = await coachProfile.update({ first_name: 'Ana', specialization: 'Doubles' }, coachReq);
  assert.equal(coach.first_name, 'Ana');
  assert.equal(coach.specialization, 'Doubles');
  await assert.rejects(
    coachProfile.update({ certification_no: 'changed-by-user' }, coachReq),
    error => error.status === 422 && !!error.fields.certification_no,
  );
  const coachPhoto = await coachProfile.photo(coachReq.user, { path: 'profiles/coach.png' }, coachReq);
  assert.equal(coachPhoto.photo_path, 'profiles/coach.png');

  const stored = await query('SELECT photo_path FROM referee_profiles WHERE user_id=$1', [coachId]);
  assert.equal(stored.rows[0].photo_path, 'profiles/coach.png');
});
