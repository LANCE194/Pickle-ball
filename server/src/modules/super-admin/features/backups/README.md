# Super Admin backups

- `GET /api/super-admin/backups` lists full backups and legacy database-only backups.
- `POST /api/super-admin/backups` creates a full database and private-file backup.
- `GET /api/super-admin/backups/:name` downloads a stored backup.
- `POST /api/super-admin/backups/import` validates and restores a full `.dnbackup.gz` or legacy SQLite `.db` file. A safety backup is created before restore.
- `POST /api/super-admin/backups/import-club/:attachmentId` merges an Admin's chat-shared club backup into the club identified in the package.

Full restores replace database contents and restore included files. Club imports merge only records for the package's existing club; login sessions, OTP codes, and audit-log IDs are not included. Club packages are accepted once.
