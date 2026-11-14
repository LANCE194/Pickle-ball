const r = require('express').Router();
const c = require('./controller');
r.get('/', c.get);
r.put('/', c.set);
module.exports = r;
