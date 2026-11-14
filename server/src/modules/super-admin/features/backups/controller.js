const s = require('./service');
const { wrap, HttpError } = require('../../../../shared/utils');
const backupTransfer = require('../../../../shared/services/backupTransfer');
exports.list = wrap(async (req, res) => res.json(await s.list()));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req)));
exports.download = wrap(async (req, res) => res.download(s.file(req.params.name)));
exports.importFull = wrap(async (req, res) => {
  if (!req.file) throw new HttpError(422, 'Choose a DinkNest full backup to restore.', 'BACKUP_REQUIRED');
  res.json(await s.importFull(req, req.file.buffer));
});
exports.importClub = wrap(async (req, res) => {
  const buffer = await backupTransfer.clubBackupAttachment(req.user, req.params.attachmentId);
  res.json(await s.importClub(req, buffer));
});
