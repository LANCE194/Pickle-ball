const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/:id/revoke', c.revoke);
module.exports = r;
