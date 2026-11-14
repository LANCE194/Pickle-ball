const r = require('express').Router();
const c = require('./controller');
const backupUpload = require('../../../../middleware/backupUpload');
r.get('/', c.list);
r.post('/', c.create);
r.post('/import', backupUpload, c.importFull);
r.post('/import-club/:attachmentId', c.importClub);
r.get('/:name', c.download);
module.exports = r;
