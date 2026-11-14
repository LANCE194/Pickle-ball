const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const { HttpError } = require('../shared/utils');
const MAX = 5 * 1024 * 1024;
const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX, files: 1 } });
function sniff(buf) { // check real file signature, not just the extension
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  return null;
}
/** imageUpload('proofs') -> req.savedFile = { name, path, kind, mime, bytes }. Files live outside any public folder. */
module.exports = (kind, field = 'file', { required = true } = {}) => [
  (req, res, next) => mem.single(field)(req, res, err => {
    if (err) return next(new HttpError(422, err.code === 'LIMIT_FILE_SIZE' ? 'That picture is too big. Please use a JPG or PNG under 5 MB.' : 'We could not read that file. Please try again.', 'UPLOAD'));
    next();
  }),
  (req, res, next) => {
    if (!req.file) return required ? next(new HttpError(422, 'Please choose a JPG or PNG picture.', 'UPLOAD')) : next();
    const t = sniff(req.file.buffer);
    if (!t) return next(new HttpError(422, 'Only JPG or PNG pictures are allowed.', 'UPLOAD'));
    const dir = path.join(env.storageDir, kind); fs.mkdirSync(dir, { recursive: true });
    const name = crypto.randomUUID() + '.' + t.ext;
    fs.writeFileSync(path.join(dir, name), req.file.buffer);
    req.savedFile = { name, kind, path: `${kind}/${name}`, mime: t.mime, bytes: req.file.size };
    next();
  },
];
module.exports.absolute = rel => path.join(env.storageDir, rel);
