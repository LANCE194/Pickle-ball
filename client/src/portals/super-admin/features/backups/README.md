# Super Admin backups

The Super Admin can create/download full-system `.dnbackup.gz` files and restore a validated full backup. A restore validates the SQLite database and file checksums, creates a pre-restore safety backup, restores the database and uploaded files, and invalidates sessions not present in the restored copy.

Legacy database-only `.db` backups remain importable; their missing uploaded files cannot be recovered.

Club-only backups arrive as attachments in direct Messages. The Super Admin can merge one into the club named in the backup; imports are one-time and never overwrite another club.
