const r = require('express').Router();
const c = require('./controller');
r.get('/', c.get);
r.put('/', c.save);
module.exports = r;
