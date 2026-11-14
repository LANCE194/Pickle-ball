const r = require('express').Router();
const c = require('./controller');
r.get('/activity', c.activity);
r.get('/', c.list);
r.post('/:id/cancel', c.cancel);
module.exports = r;
