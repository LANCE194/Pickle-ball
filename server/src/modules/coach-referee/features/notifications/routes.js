const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.post('/read', c.read);
module.exports = r;
