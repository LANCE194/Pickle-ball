const multer = require('multer');
const { HttpError } = require('../shared/utils');

const receive = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 * 1024, files: 1 },
}).single('file');

module.exports = (req, res, next) => receive(req, res, error => {
  if (!error) return next();
  const message = error.code === 'LIMIT_FILE_SIZE'
    ? 'That backup is too large to import (maximum 512 MB).'
    : 'We could not read that backup file.';
  next(new HttpError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422, message, 'BACKUP_UPLOAD'));
});
