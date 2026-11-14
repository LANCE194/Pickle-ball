const backups = require('../../../../shared/services/backups');

exports.list = async () => backups.listFull();
exports.create = async req => backups.createFull(req);
exports.file = name => backups.archivePath(name);
exports.importFull = (req, buffer) => backups.importFull(req, buffer);
exports.importClub = (req, buffer) => backups.importClub(req, buffer);
