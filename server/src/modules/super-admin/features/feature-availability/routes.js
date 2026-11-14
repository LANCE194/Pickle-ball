const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.get('/requests', c.requests);
r.patch('/requests/:id', c.setRequest);
r.patch('/:key', c.set);
module.exports = r;
