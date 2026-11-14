const r = require('express').Router();
const c = require('./controller');
r.post('/export', c.exportClub);
r.post('/send', c.sendToSuperAdmin);
r.get('/:name', c.download);
module.exports = r;
