process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { up } = require('../../../../database/migrations/001_multiclub');
const { migrate } = require('../../scripts/migrate');
const { query, db } = require('../../config/db');

migrate();

const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const SECOND_CLUB_ID = '00000000-0000-0000-0000-000000000002';

const tenantTables = [
  'sessions', 'otp_codes', 'players', 'staff_profiles', 'referee_profiles', 'inquiries',
  'feature_requests', 'court_blocks', 'bookings', 'payment_qr_codes', 'payments',
  'membership_plans', 'memberships', 'tournaments', 'tournament_entries', 'matches',
  'match_scores', 'rating_history', 'open_play_posts', 'open_play_members',
  'announcements', 'notifications', 'attendance', 'audit_logs', 'site_themes',
  'site_sections', 'site_versions', 'media_assets',
];

function createLegacyDatabase() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, role TEXT NOT NULL, email TEXT, mobile TEXT, archived_at TEXT);
    CREATE UNIQUE INDEX users_email_uq ON users (lower(email)) WHERE email IS NOT NULL;
    CREATE UNIQUE INDEX users_mobile_uq ON users (mobile) WHERE mobile IS NOT NULL;
    CREATE UNIQUE INDEX users_single_super_admin ON users (role) WHERE role = 'super_admin';
    INSERT INTO users (id, role, email, mobile) VALUES
      ('admin-1', 'admin', 'owner@example.test', '09170000001'),
      ('root-1', 'super_admin', 'root@example.test', NULL);

    CREATE TABLE features (key TEXT PRIMARY KEY);
    INSERT INTO features (key) VALUES ('bookings_schedule');
    CREATE TABLE club_features (
      feature_key TEXT PRIMARY KEY REFERENCES features(key), enabled INTEGER NOT NULL DEFAULT 1,
      changed_by TEXT, changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO club_features (feature_key, enabled) VALUES ('bookings_schedule', 1);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_by TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO settings (key, value) VALUES ('opening_time', '"06:00"');
    CREATE TABLE courts (
      id TEXT PRIMARY KEY, court_number INTEGER UNIQUE NOT NULL, name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'indoor', surface TEXT, photo_path TEXT,
      hourly_rate REAL NOT NULL DEFAULT 300, peak_rate REAL NOT NULL DEFAULT 400, offpeak_rate REAL NOT NULL DEFAULT 300,
      status TEXT NOT NULL DEFAULT 'available', opens_at TEXT NOT NULL DEFAULT '06:00', closes_at TEXT NOT NULL DEFAULT '22:00',
      peak_start TEXT NOT NULL DEFAULT '17:00', peak_end TEXT NOT NULL DEFAULT '21:00',
      weekend_all_day_peak INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, archived_at TEXT
    );
    INSERT INTO courts (id, court_number, name) VALUES ('court-1', 1, 'Court 1');
    CREATE TABLE site_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), launch_status TEXT NOT NULL DEFAULT 'pre_launch',
      updated_by TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO site_settings (id, launch_status) VALUES (1, 'live');
    CREATE TABLE site_pages (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL);
    INSERT INTO site_pages (id, slug, title) VALUES ('page-1', 'home', 'Home');
  `);
  for (const table of tenantTables) {
    db.exec(`CREATE TABLE "${table}" (id TEXT PRIMARY KEY, payload TEXT)`);
    db.prepare(`INSERT INTO "${table}" (id, payload) VALUES (?, ?)`).run(`${table}-1`, 'preserve-me');
  }
  return db;
}

test('upgrades populated legacy rows and enables club-scoped uniqueness', () => {
  const db = createLegacyDatabase();
  try {
    up(db);

    for (const table of ['users', ...tenantTables, 'club_features', 'settings', 'courts', 'site_settings', 'site_pages']) {
      const names = db.prepare(`PRAGMA table_info("${table}")`).all().map(row => row.name);
      assert.ok(names.includes('club_id'), `${table} should receive club_id`);
    }

    const userRows = db.prepare('SELECT id, role, club_id FROM users ORDER BY id').all();
    assert.deepEqual(userRows, [
      { id: 'admin-1', role: 'admin', club_id: DEFAULT_CLUB_ID },
      { id: 'root-1', role: 'super_admin', club_id: null },
    ]);
    assert.equal(db.prepare('SELECT payload FROM bookings WHERE id=?').get('bookings-1').payload, 'preserve-me');
    assert.equal(db.prepare('SELECT enabled FROM club_features WHERE club_id=? AND feature_key=?').get(DEFAULT_CLUB_ID, 'bookings_schedule').enabled, 1);
    assert.equal(db.prepare('SELECT value FROM settings WHERE club_id=? AND key=?').get(DEFAULT_CLUB_ID, 'opening_time').value, '"06:00"');
    assert.equal(db.prepare('SELECT launch_status FROM site_settings WHERE club_id=?').get(DEFAULT_CLUB_ID).launch_status, 'live');
    assert.throws(() => db.prepare('INSERT INTO players (id, payload, club_id) VALUES (?, ?, ?)').run('bad-club-row', 'invalid', 'missing-club'), /TENANT_CLUB_MISSING/);
    assert.throws(() => db.prepare("INSERT INTO users (id, role, email, club_id) VALUES ('admin-no-club', 'admin', 'no-club@example.test', NULL)").run(), /INVALID_USER_TENANCY/);

    db.prepare("INSERT INTO clubs (id, name, slug) VALUES (?, 'Second Club', 'second-club')").run(SECOND_CLUB_ID);
    db.prepare("INSERT INTO users (id, role, email, mobile, club_id) VALUES ('admin-2', 'admin', 'owner@example.test', '09170000002', ?)").run(SECOND_CLUB_ID);
    db.prepare("INSERT INTO courts (id, club_id, court_number, name) VALUES ('court-2', ?, 1, 'Court 1')").run(SECOND_CLUB_ID);
    db.prepare("INSERT INTO settings (club_id, key, value) VALUES (?, 'opening_time', '\"07:00\"')").run(SECOND_CLUB_ID);
    db.prepare("INSERT INTO site_pages (id, club_id, slug, title) VALUES ('page-2', ?, 'home', 'Home')").run(SECOND_CLUB_ID);
    db.prepare("INSERT INTO site_settings (club_id, id, launch_status) VALUES (?, 1, 'live')").run(SECOND_CLUB_ID);

    assert.throws(() => db.prepare("INSERT INTO users (id, role, email, mobile, club_id) VALUES ('admin-duplicate', 'admin', 'OWNER@example.test', '09170000003', ?)").run(DEFAULT_CLUB_ID));
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM courts WHERE court_number=1').get().count, 2);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM settings WHERE key='opening_time'").get().count, 2);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM site_pages WHERE slug='home'").get().count, 2);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {
    db.close();
  }
});

test('booking overlap protection is scoped to the owning club', async () => {
  const secondClubId = '00000000-0000-0000-0000-000000000002';
  const secondCourtId = '00000000-0000-0000-0000-000000000102';
  const defaultClubId = '00000000-0000-0000-0000-000000000001';
  await query("INSERT INTO clubs (id, name, slug) VALUES ($1, 'Second Club', 'second-club')", [secondClubId]);
  await query("INSERT INTO courts (id, club_id, court_number, name) VALUES ($1, $2, 1, 'Court 1')", [secondCourtId, secondClubId]);
  const defaultCourtId = (await query('SELECT id FROM courts WHERE club_id=$1 AND court_number=1', [defaultClubId])).rows[0].id;
  const startsAt = '2035-01-01T10:00:00.000Z';
  const endsAt = '2035-01-01T11:00:00.000Z';
  const insertBooking = (id, clubId, courtId) => query(
    `INSERT INTO bookings (id, club_id, court_id, starts_at, ends_at, duration_hours, status, price)
     VALUES ($1, $2, $3, $4, $5, 1, 'confirmed', 1)`,
    [id, clubId, courtId, startsAt, endsAt],
  );

  await insertBooking('booking-default-1', defaultClubId, defaultCourtId);
  await assert.rejects(insertBooking('booking-default-2', defaultClubId, defaultCourtId), error => error.message.includes('SLOT_TAKEN'));
  await insertBooking('booking-second-1', secondClubId, secondCourtId);
});

test.after(() => db.close());
