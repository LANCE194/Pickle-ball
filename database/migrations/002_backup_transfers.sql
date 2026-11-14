CREATE TABLE IF NOT EXISTS backup_imports (
  package_id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id),
  imported_by TEXT REFERENCES users(id),
  imported_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS chat_attachments (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('club_backup')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes > 0),
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS chat_attachments_message_idx ON chat_attachments(message_id);
