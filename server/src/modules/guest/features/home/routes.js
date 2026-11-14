const r = require('express').Router();
const c = require('./controller');
r.get('/', c.home);
module.exports = r;
