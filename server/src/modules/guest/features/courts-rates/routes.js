const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
module.exports = r;
