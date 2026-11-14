const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.use(perm('members_edit'));
r.get('/', c.today);
r.get('/search', c.search);
r.post('/', c.checkIn);
module.exports = r;
