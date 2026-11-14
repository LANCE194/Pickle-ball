const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const UUID = "lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6)))";
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

function tableExists(db, table) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
}

function columns(db, table) {
  return new Set(db.prepare(`PRAGMA table_info("${table}")`).all().map(row => row.name));
}

function replaceTable(db, table, definition, insert) {
  const temporary = `_multiclub_${table}`;
  db.exec(`DROP TABLE IF EXISTS "${temporary}"`);
  db.exec(`CREATE TABLE "${temporary}" ${definition}`);
  db.exec(insert.replaceAll('{temporary}', `"${temporary}"`).replaceAll('{table}', `"${table}"`));
  db.exec(`DROP TABLE "${table}"`);
  db.exec(`ALTER TABLE "${temporary}" RENAME TO "${table}"`);
}

function up(db) {
  if (!tableExists(db, 'users') || columns(db, 'users').has('club_id')) return;

  db.exec('PRAGMA foreign_keys=OFF');
  try {
    db.exec('BEGIN IMMEDIATE');
    db.exec(`CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','disabled','archived')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (${NOW}), updated_at TEXT NOT NULL DEFAULT (${NOW})
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS club_domains (
      id TEXT PRIMARY KEY DEFAULT (${UUID}),
      club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      host TEXT NOT NULL UNIQUE,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','disabled')),
      verification_token TEXT,
      https_ready INTEGER NOT NULL DEFAULT 0,
      verified_at TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (${NOW}), updated_at TEXT NOT NULL DEFAULT (${NOW})
    )`);
    db.prepare(`INSERT INTO clubs (id, name, slug, status) VALUES (?, 'Default Club', 'default-club', 'active') ON CONFLICT(id) DO NOTHING`).run(DEFAULT_CLUB_ID);

    db.exec('DROP INDEX IF EXISTS users_email_uq; DROP INDEX IF EXISTS users_mobile_uq');
    db.exec('DROP TRIGGER IF EXISTS bookings_no_overlap_ins; DROP TRIGGER IF EXISTS bookings_no_overlap_upd');

    replaceTable(db, 'club_features',
      `(club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}' REFERENCES clubs(id), feature_key TEXT NOT NULL REFERENCES features(key),
        enabled INTEGER NOT NULL DEFAULT 1, changed_by TEXT REFERENCES users(id), changed_at TEXT NOT NULL DEFAULT (${NOW}),
        PRIMARY KEY (club_id, feature_key))`,
      `INSERT INTO {temporary} (club_id, feature_key, enabled, changed_by, changed_at)
       SELECT '${DEFAULT_CLUB_ID}', feature_key, enabled, changed_by, changed_at FROM {table}`);

    replaceTable(db, 'settings',
      `(club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}' REFERENCES clubs(id), key TEXT NOT NULL, value TEXT NOT NULL,
        updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT (${NOW}), PRIMARY KEY (club_id, key))`,
      `INSERT INTO {temporary} (club_id, key, value, updated_by, updated_at)
       SELECT '${DEFAULT_CLUB_ID}', key, value, updated_by, updated_at FROM {table}`);

    replaceTable(db, 'courts',
      `(id TEXT PRIMARY KEY DEFAULT (${UUID}), club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}' REFERENCES clubs(id),
        court_number INTEGER NOT NULL, name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'indoor' CHECK (type IN ('indoor','outdoor')),
        surface TEXT, photo_path TEXT, hourly_rate REAL NOT NULL DEFAULT 300, peak_rate REAL NOT NULL DEFAULT 400,
        offpeak_rate REAL NOT NULL DEFAULT 300, status TEXT NOT NULL DEFAULT 'available'
        CHECK (status IN ('available','maintenance','closed')),
        opens_at TEXT NOT NULL DEFAULT '06:00', closes_at TEXT NOT NULL DEFAULT '22:00',
        peak_start TEXT NOT NULL DEFAULT '17:00', peak_end TEXT NOT NULL DEFAULT '21:00',
        weekend_all_day_peak INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (${NOW}),
        updated_at TEXT NOT NULL DEFAULT (${NOW}), archived_at TEXT)`,
      `INSERT INTO {temporary} (id, club_id, court_number, name, type, surface, photo_path, hourly_rate, peak_rate,
        offpeak_rate, status, opens_at, closes_at, peak_start, peak_end, weekend_all_day_peak, created_at, updated_at, archived_at)
       SELECT id, '${DEFAULT_CLUB_ID}', court_number, name, type, surface, photo_path, hourly_rate, peak_rate,
        offpeak_rate, status, opens_at, closes_at, peak_start, peak_end, weekend_all_day_peak, created_at, updated_at, archived_at
       FROM {table}`);

    replaceTable(db, 'site_settings',
      `(club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}' REFERENCES clubs(id), id INTEGER NOT NULL DEFAULT 1 CHECK (id = 1),
        launch_status TEXT NOT NULL DEFAULT 'pre_launch' CHECK (launch_status IN ('pre_launch','live')),
        updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT (${NOW}), PRIMARY KEY (club_id, id))`,
      `INSERT INTO {temporary} (club_id, id, launch_status, updated_by, updated_at)
       SELECT '${DEFAULT_CLUB_ID}', id, launch_status, updated_by, updated_at FROM {table}`);

    replaceTable(db, 'site_pages',
      `(id TEXT PRIMARY KEY DEFAULT (${UUID}), club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}' REFERENCES clubs(id), slug TEXT NOT NULL, title TEXT NOT NULL)`,
      `INSERT INTO {temporary} (id, club_id, slug, title)
       SELECT id, '${DEFAULT_CLUB_ID}', slug, title FROM {table}`);

    const tenantTables = [
      'sessions', 'otp_codes', 'players', 'staff_profiles', 'referee_profiles', 'inquiries',
      'feature_requests', 'court_blocks', 'bookings', 'payment_qr_codes', 'payments',
      'membership_plans', 'memberships', 'tournaments', 'tournament_entries', 'matches',
      'match_scores', 'rating_history', 'open_play_posts', 'open_play_members',
      'announcements', 'notifications', 'attendance', 'audit_logs', 'site_themes',
      'site_sections', 'site_versions', 'media_assets',
    ];
    for (const table of tenantTables) {
      if (!tableExists(db, table) || columns(db, table).has('club_id')) continue;
      db.exec(`ALTER TABLE "${table}" ADD COLUMN club_id TEXT NOT NULL DEFAULT '${DEFAULT_CLUB_ID}'`);
    }

    db.exec(`ALTER TABLE users ADD COLUMN club_id TEXT REFERENCES clubs(id)`);
    db.prepare(`UPDATE users SET club_id = CASE WHEN role = 'super_admin' THEN NULL ELSE ? END`).run(DEFAULT_CLUB_ID);
    db.exec(`CREATE UNIQUE INDEX users_email_uq ON users (club_id, lower(email)) WHERE email IS NOT NULL AND role <> 'super_admin'`);
    db.exec(`CREATE UNIQUE INDEX users_mobile_uq ON users (club_id, mobile) WHERE mobile IS NOT NULL AND role <> 'super_admin'`);
    db.exec(`CREATE UNIQUE INDEX courts_club_number_uq ON courts (club_id, court_number)`);
    db.exec(`CREATE UNIQUE INDEX site_pages_club_slug_uq ON site_pages (club_id, slug)`);
    const ownedTables = ['users', ...tenantTables, 'club_features', 'settings', 'courts', 'site_settings', 'site_pages'];
    for (const table of ownedTables) {
      if (!tableExists(db, table)) continue;
      db.exec(`CREATE TRIGGER IF NOT EXISTS "${table}_club_fk_insert" BEFORE INSERT ON "${table}"
        WHEN NEW.club_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clubs WHERE id=NEW.club_id)
        BEGIN SELECT RAISE(ABORT, 'TENANT_CLUB_MISSING'); END`);
      db.exec(`CREATE TRIGGER IF NOT EXISTS "${table}_club_fk_update" BEFORE UPDATE OF club_id ON "${table}"
        WHEN NEW.club_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clubs WHERE id=NEW.club_id)
        BEGIN SELECT RAISE(ABORT, 'TENANT_CLUB_MISSING'); END`);
    }
    db.exec(`CREATE TRIGGER users_tenancy_insert BEFORE INSERT ON users
      WHEN (NEW.role='super_admin' AND NEW.club_id IS NOT NULL) OR (NEW.role<>'super_admin' AND NEW.club_id IS NULL)
      BEGIN SELECT RAISE(ABORT, 'INVALID_USER_TENANCY'); END`);
    db.exec(`CREATE TRIGGER users_tenancy_update BEFORE UPDATE OF role, club_id ON users
      WHEN (NEW.role='super_admin' AND NEW.club_id IS NOT NULL) OR (NEW.role<>'super_admin' AND NEW.club_id IS NULL)
      BEGIN SELECT RAISE(ABORT, 'INVALID_USER_TENANCY'); END`);
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* transaction may not have started */ }
    throw error;
  } finally {
    db.exec('PRAGMA foreign_keys=ON');
  }
}

module.exports = { beforeSchema: true, up };
