const r = require('express').Router();
const c = require('./controller');
r.get('/', c.get);
module.exports = r;
