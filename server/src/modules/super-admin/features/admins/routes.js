const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/', c.create);
r.post('/:id/reset-password', c.reset);
r.post('/:id/status', c.status);
module.exports = r;
