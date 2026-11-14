const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/', c.create);
r.patch('/:userId/permissions', c.permissions);
r.post('/:userId/reset-password', c.reset);
r.post('/:userId/status', c.status);
module.exports = r;
