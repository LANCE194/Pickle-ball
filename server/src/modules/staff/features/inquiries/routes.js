const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/:id/handled', c.handled);
module.exports = r;
