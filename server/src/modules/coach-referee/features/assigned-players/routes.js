const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/:id/verify-level', c.verify);
module.exports = r;
