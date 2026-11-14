-- DinkNest schema for SQLite (better-sqlite3). Times are stored in UTC as ISO text and shown in Asia/Manila.
-- now() and gen_random_uuid() are expanded by the db layer (config/db.js) into plain SQLite expressions.
-- Enums are CHECK constraints. Booleans are 0/1. JSON columns are TEXT.

CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, description TEXT);
CREATE TABLE IF NOT EXISTS role_permissions (
  role_key TEXT NOT NULL REFERENCES roles(key), permission_key TEXT NOT NULL REFERENCES permissions(key),
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','disabled','archived')),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS club_domains (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  host TEXT NOT NULL UNIQUE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','disabled')),
  verification_token TEXT,
  https_ready INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS club_domains_club_idx ON club_domains(club_id, verification_status);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT REFERENCES clubs(id),
  role TEXT NOT NULL REFERENCES roles(key),
  email TEXT, mobile TEXT, password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','archived')),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  temp_password_expires_at TEXT,
  totp_secret TEXT, totp_enrolled INTEGER NOT NULL DEFAULT 0,
  failed_logins INTEGER NOT NULL DEFAULT 0, locked_until TEXT,
  created_by TEXT REFERENCES users(id),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT,
  CHECK ((role = 'super_admin' AND club_id IS NULL) OR (role <> 'super_admin' AND club_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (club_id, lower(email)) WHERE email IS NOT NULL AND role <> 'super_admin';
CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_uq ON users (club_id, mobile) WHERE mobile IS NOT NULL AND role <> 'super_admin';
CREATE UNIQUE INDEX IF NOT EXISTS users_single_super_admin ON users (role) WHERE role = 'super_admin';

INSERT INTO clubs (id, name, slug, status) VALUES ('00000000-0000-0000-0000-000000000001', 'Default Club', 'default-club', 'active') ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL, device_info TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), last_seen_at TEXT NOT NULL DEFAULT (now()), revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  code_hash TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'activation',
  expires_at TEXT NOT NULL, used_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT UNIQUE REFERENCES users(id),
  first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, nickname TEXT,
  birthdate TEXT, gender TEXT,
  street TEXT, barangay TEXT, city TEXT, province TEXT, photo_path TEXT,
  emergency_name TEXT, emergency_relationship TEXT, emergency_number TEXT,
  skill_level TEXT DEFAULT 'beginner', rating REAL NOT NULL DEFAULT 2.5,
  level_verified INTEGER NOT NULL DEFAULT 0,
  dominant_hand TEXT, preferred_format TEXT, height_cm INTEGER, occupation TEXT,
  heard_about TEXT, shirt_size TEXT, joined_at TEXT DEFAULT (date('now','+8 hours')),
  waiver_accepted INTEGER NOT NULL DEFAULT 0, waiver_accepted_at TEXT,
  medical_notes TEXT,
  guardian_name TEXT, guardian_relationship TEXT, guardian_contact TEXT, guardian_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active','inactive','suspended','pending_verification')),
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()),
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS players_name_idx ON players (lower(last_name), lower(first_name));

CREATE TABLE IF NOT EXISTS staff_profiles (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, nickname TEXT,
  birthdate TEXT, gender TEXT, street TEXT, barangay TEXT, city TEXT, province TEXT, photo_path TEXT,
  emergency_name TEXT, emergency_relationship TEXT, emergency_number TEXT,
  employee_id TEXT, position_title TEXT, work_schedule TEXT, date_hired TEXT,
  employment_status TEXT NOT NULL DEFAULT 'active', permission_template TEXT DEFAULT 'staff_50',
  permissions TEXT NOT NULL DEFAULT '{"bookings":true,"payments":true,"courts_edit":true,"members_edit":true,"events_post":true,"matches_score":true,"sensitive_view":false}',
  club_name TEXT, business_address TEXT, business_contact TEXT, business_permit_no TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);

CREATE TABLE IF NOT EXISTS referee_profiles (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, nickname TEXT,
  birthdate TEXT, gender TEXT, street TEXT, barangay TEXT, city TEXT, province TEXT, photo_path TEXT,
  emergency_name TEXT, emergency_relationship TEXT, emergency_number TEXT,
  role_type TEXT NOT NULL DEFAULT 'referee' CHECK (role_type IN ('coach','referee','both')),
  certification_name TEXT, certification_no TEXT, certifying_body TEXT, certification_expiry TEXT,
  specialization TEXT, years_experience INTEGER, matches_officiated INTEGER NOT NULL DEFAULT 0,
  level_min REAL, level_max REAL,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  name TEXT NOT NULL, age_range TEXT, contact TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('booking','tournament','membership','other')),
  message TEXT, consent INTEGER NOT NULL DEFAULT 0,
  handled INTEGER NOT NULL DEFAULT 0, handled_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS features (
  key TEXT PRIMARY KEY, label TEXT NOT NULL, description TEXT NOT NULL, area TEXT NOT NULL,
  is_core INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  locked INTEGER NOT NULL DEFAULT 0,
  requires TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS club_features (
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  feature_key TEXT NOT NULL REFERENCES features(key),
  enabled INTEGER NOT NULL DEFAULT 1,
  changed_by TEXT REFERENCES users(id), changed_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (club_id, feature_key)
);
CREATE TABLE IF NOT EXISTS feature_requests (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  requested_by TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new feature','change','unlock')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','accepted','in_progress','done','declined')), status_note TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS settings (
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  key TEXT NOT NULL, value TEXT NOT NULL, updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (club_id, key)
);

CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  court_number INTEGER NOT NULL, name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'indoor' CHECK (type IN ('indoor','outdoor')),
  surface TEXT, photo_path TEXT,
  hourly_rate REAL NOT NULL DEFAULT 300, peak_rate REAL NOT NULL DEFAULT 400, offpeak_rate REAL NOT NULL DEFAULT 300,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','maintenance','closed')),
  opens_at TEXT NOT NULL DEFAULT '06:00', closes_at TEXT NOT NULL DEFAULT '22:00',
  peak_start TEXT NOT NULL DEFAULT '17:00', peak_end TEXT NOT NULL DEFAULT '21:00', weekend_all_day_peak INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS courts_club_number_uq ON courts (club_id, court_number);

CREATE TABLE IF NOT EXISTS court_blocks (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, reason TEXT,
  created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT,
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS court_blocks_idx ON court_blocks(court_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  player_id TEXT REFERENCES players(id),
  booked_by TEXT REFERENCES users(id),
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
  duration_hours INTEGER NOT NULL CHECK (duration_hours BETWEEN 1 AND 3),
  players_count INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show','expired')),
  price REAL NOT NULL, discount REAL NOT NULL DEFAULT 0,
  is_walk_in INTEGER NOT NULL DEFAULT 0, recurring_group TEXT,
  expires_at TEXT, cancel_reason TEXT, cancelled_at TEXT, reminder_sent_at TEXT,
  open_play_post_id TEXT, tournament_match_id TEXT, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS bookings_court_date_idx ON bookings (court_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS bookings_player_idx ON bookings (player_id, starts_at);
-- Hard guarantee against double-booking (replaces the Postgres exclusion constraint). The db layer maps SLOT_TAKEN to a friendly message.
CREATE TRIGGER IF NOT EXISTS bookings_no_overlap_ins BEFORE INSERT ON bookings
WHEN NEW.status IN ('pending','confirmed','completed')
BEGIN
  SELECT RAISE(ABORT, 'SLOT_TAKEN') WHERE EXISTS (
    SELECT 1 FROM bookings b WHERE b.club_id = NEW.club_id AND b.court_id = NEW.court_id AND b.status IN ('pending','confirmed','completed')
    AND b.starts_at < NEW.ends_at AND b.ends_at > NEW.starts_at);
END;
CREATE TRIGGER IF NOT EXISTS bookings_no_overlap_upd BEFORE UPDATE OF court_id, starts_at, ends_at, status ON bookings
WHEN NEW.status IN ('pending','confirmed','completed')
BEGIN
  SELECT RAISE(ABORT, 'SLOT_TAKEN') WHERE EXISTS (
    SELECT 1 FROM bookings b WHERE b.id <> NEW.id AND b.club_id = NEW.club_id AND b.court_id = NEW.court_id AND b.status IN ('pending','confirmed','completed')
    AND b.starts_at < NEW.ends_at AND b.ends_at > NEW.starts_at);
END;

CREATE TABLE IF NOT EXISTS payment_qr_codes (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  provider TEXT NOT NULL CHECK (provider IN ('gcash','maya','bank')),
  account_name TEXT NOT NULL, account_number TEXT NOT NULL, image_path TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  uploaded_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  booking_id TEXT REFERENCES bookings(id), tournament_entry_id TEXT, membership_id TEXT,
  player_id TEXT REFERENCES players(id),
  amount REAL NOT NULL, reference_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','pending_verification','approved','rejected','pay_at_court_pending','paid_at_court')),
  qr_code_id TEXT REFERENCES payment_qr_codes(id),
  proof_path TEXT, proof_reference_no TEXT,
  reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT, reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status, created_at);

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  name TEXT NOT NULL, price REAL NOT NULL, duration_days INTEGER NOT NULL,
  discount_percent REAL NOT NULL DEFAULT 0, priority_booking INTEGER NOT NULL DEFAULT 0, perks TEXT,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  player_id TEXT NOT NULL REFERENCES players(id), plan_id TEXT NOT NULL REFERENCES membership_plans(id),
  starts_on TEXT NOT NULL, expires_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expiring','expired','cancelled')),
  reminder_sent_at TEXT, created_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE INDEX IF NOT EXISTS memberships_exp_idx ON memberships(expires_on, status);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  name TEXT NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('single_elimination','double_elimination','round_robin')),
  category TEXT NOT NULL CHECK (category IN ('singles','doubles','mixed')),
  level_min REAL NOT NULL DEFAULT 1.0, level_max REAL NOT NULL DEFAULT 6.0,
  age_bracket TEXT DEFAULT 'open', entry_fee REAL NOT NULL DEFAULT 0, max_slots INTEGER NOT NULL DEFAULT 16,
  rules TEXT, prizes TEXT, registration_deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','registration_open','registration_closed','in_progress','completed','cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public',
  created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE TABLE IF NOT EXISTS tournament_entries (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  player_id TEXT NOT NULL REFERENCES players(id), partner_id TEXT REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','waitlisted','rejected','withdrawn')),
  seed INTEGER, created_at TEXT NOT NULL DEFAULT (now()),
  UNIQUE (tournament_id, player_id)
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  tournament_id TEXT REFERENCES tournaments(id),
  round INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 1, pool TEXT,
  bracket TEXT NOT NULL DEFAULT 'W' CHECK (bracket IN ('W','L','F','RR')),
  entry_a TEXT REFERENCES tournament_entries(id), entry_b TEXT REFERENCES tournament_entries(id),
  winner_entry TEXT REFERENCES tournament_entries(id), next_match_id TEXT REFERENCES matches(id), next_slot TEXT,
  loser_next_match_id TEXT REFERENCES matches(id), loser_next_slot TEXT, is_bye INTEGER NOT NULL DEFAULT 0,
  court_id TEXT REFERENCES courts(id), starts_at TEXT, ends_at TEXT,
  referee_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','forfeited')),
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS matches_tour_idx ON matches(tournament_id, round, position);
CREATE TABLE IF NOT EXISTS match_scores (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  match_id TEXT NOT NULL REFERENCES matches(id), game_no INTEGER NOT NULL,
  score_a INTEGER NOT NULL CHECK (score_a >= 0), score_b INTEGER NOT NULL CHECK (score_b >= 0),
  entered_by TEXT REFERENCES users(id), confirmed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()), UNIQUE (match_id, game_no)
);
CREATE TABLE IF NOT EXISTS rating_history (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  player_id TEXT NOT NULL REFERENCES players(id), old_rating REAL, new_rating REAL NOT NULL,
  reason TEXT NOT NULL, match_id TEXT REFERENCES matches(id), changed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS open_play_posts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  host_player_id TEXT NOT NULL REFERENCES players(id), court_id TEXT REFERENCES courts(id),
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'doubles', level_min REAL NOT NULL DEFAULT 1.0, level_max REAL NOT NULL DEFAULT 6.0,
  spots_needed INTEGER NOT NULL CHECK (spots_needed > 0), cost_split REAL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','closed','cancelled')), notes TEXT, created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS open_play_members (
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  post_id TEXT NOT NULL REFERENCES open_play_posts(id), player_id TEXT NOT NULL REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','declined','left')),
  needs_host_approval INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (post_id, player_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  title TEXT NOT NULL, body TEXT NOT NULL, image_path TEXT, pinned INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','members')),
  event_starts_at TEXT, posted_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()), archived_at TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'info', read_at TEXT, emailed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read_at, created_at);
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  player_id TEXT NOT NULL REFERENCES players(id), booking_id TEXT REFERENCES bookings(id),
  checked_in_at TEXT NOT NULL DEFAULT (now()), checked_in_by TEXT REFERENCES users(id), method TEXT NOT NULL DEFAULT 'name'
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id TEXT REFERENCES clubs(id),
  user_id TEXT, role TEXT, action TEXT NOT NULL, entity TEXT, entity_id TEXT,
  details TEXT, ip TEXT, session_id TEXT, created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS audit_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs(user_id, created_at);

CREATE TABLE IF NOT EXISTS site_settings (
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  id INTEGER NOT NULL DEFAULT 1 CHECK (id = 1),
  launch_status TEXT NOT NULL DEFAULT 'pre_launch' CHECK (launch_status IN ('pre_launch','live')),
  updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (club_id, id)
);
CREATE TABLE IF NOT EXISTS site_themes (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  name TEXT NOT NULL, tokens TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS site_pages (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  slug TEXT NOT NULL, title TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS site_pages_club_slug_uq ON site_pages(club_id, slug);
CREATE TABLE IF NOT EXISTS site_sections (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  page_id TEXT REFERENCES site_pages(id), kind TEXT NOT NULL, default_content TEXT
);
CREATE TABLE IF NOT EXISTS site_versions (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  version_no INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','changes_requested','approved','live','rejected','archived')),
  config_json TEXT NOT NULL, note TEXT, created_by TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id), review_note TEXT, deployed_at TEXT,
  preview_token TEXT, preview_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  club_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES clubs(id),
  path TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
  uploaded_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (now())
);
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  participant_low TEXT NOT NULL REFERENCES users(id),
  participant_high TEXT NOT NULL REFERENCES users(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()), updated_at TEXT NOT NULL DEFAULT (now()),
  UNIQUE (participant_low, participant_high),
  CHECK (participant_low < participant_high)
);
CREATE TABLE IF NOT EXISTS chat_participants (
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TEXT,
  joined_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS chat_participants_user_idx ON chat_participants(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS sessions_club_idx ON sessions(club_id, user_id);
CREATE INDEX IF NOT EXISTS otp_codes_club_idx ON otp_codes(club_id, user_id, purpose);
CREATE INDEX IF NOT EXISTS players_club_idx ON players(club_id, user_id);
CREATE INDEX IF NOT EXISTS staff_profiles_club_idx ON staff_profiles(club_id, user_id);
CREATE INDEX IF NOT EXISTS referee_profiles_club_idx ON referee_profiles(club_id, user_id);
CREATE INDEX IF NOT EXISTS inquiries_club_idx ON inquiries(club_id, created_at);
CREATE INDEX IF NOT EXISTS feature_requests_club_idx ON feature_requests(club_id, status, created_at);
CREATE INDEX IF NOT EXISTS court_blocks_club_idx ON court_blocks(club_id, court_id, starts_at);
CREATE INDEX IF NOT EXISTS bookings_club_idx ON bookings(club_id, court_id, starts_at);
CREATE INDEX IF NOT EXISTS payment_qr_codes_club_idx ON payment_qr_codes(club_id, enabled);
CREATE INDEX IF NOT EXISTS payments_club_idx ON payments(club_id, status, created_at);
CREATE INDEX IF NOT EXISTS membership_plans_club_idx ON membership_plans(club_id, active);
CREATE INDEX IF NOT EXISTS memberships_club_idx ON memberships(club_id, player_id, status);
CREATE INDEX IF NOT EXISTS tournaments_club_idx ON tournaments(club_id, status, starts_on);
CREATE INDEX IF NOT EXISTS tournament_entries_club_idx ON tournament_entries(club_id, tournament_id);
CREATE INDEX IF NOT EXISTS matches_club_idx ON matches(club_id, tournament_id, starts_at);
CREATE INDEX IF NOT EXISTS match_scores_club_idx ON match_scores(club_id, match_id);
CREATE INDEX IF NOT EXISTS rating_history_club_idx ON rating_history(club_id, player_id, created_at);
CREATE INDEX IF NOT EXISTS open_play_posts_club_idx ON open_play_posts(club_id, starts_at);
CREATE INDEX IF NOT EXISTS open_play_members_club_idx ON open_play_members(club_id, post_id, player_id);
CREATE INDEX IF NOT EXISTS announcements_club_idx ON announcements(club_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_club_idx ON notifications(club_id, user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS attendance_club_idx ON attendance(club_id, player_id, checked_in_at);
CREATE INDEX IF NOT EXISTS audit_logs_club_idx ON audit_logs(club_id, created_at);
CREATE INDEX IF NOT EXISTS site_themes_club_idx ON site_themes(club_id);
CREATE INDEX IF NOT EXISTS site_sections_club_idx ON site_sections(club_id, page_id);
CREATE INDEX IF NOT EXISTS site_versions_club_idx ON site_versions(club_id, version_no);
CREATE INDEX IF NOT EXISTS media_assets_club_idx ON media_assets(club_id, created_at);
