const fs = require('fs');
const backups = require('../../../../shared/services/backups');
const backupTransfer = require('../../../../shared/services/backupTransfer');
const { audit } = require('../../../../shared/services/audit');
const { wrap, HttpError } = require('../../../../shared/utils');

exports.exportClub = wrap(async (req, res) => res.status(201).json(await backups.createClub(req)));

exports.download = wrap(async (req, res) => {
  const file = backups.archivePath(req.params.name);
  const payload = backups.decodeArchive(fs.readFileSync(file), 'club');
  if (!payload.club || payload.club.id !== req.user.clubId) throw new HttpError(403, 'You can only download your own club backup.', 'BACKUP_FORBIDDEN');
  res.download(file, req.params.name);
});

exports.sendToSuperAdmin = wrap(async (req, res) => {
  const archive = await backups.makeClubArchive(req);
  const message = await backupTransfer.sendClubBackupToSuperAdmin(req, archive);
  await audit(req, 'backup.club_shared', 'backup', archive.name, { club_id: archive.clubId });
  res.status(201).json({ conversationId: message.conversationId, messageId: message.id, name: archive.name });
});
