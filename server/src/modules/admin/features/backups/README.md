# Admin club backups

- `POST /api/admin/backups/export` creates a compressed backup of the signed-in Admin's club.
- `GET /api/admin/backups/:name` downloads only a backup belonging to that Admin's club.
- `POST /api/admin/backups/send` sends a club-only backup to the active Super Admin in direct chat.

Club packages merge only into the club identified in the package. Login sessions, OTP codes, and audit-log IDs are not exported.
