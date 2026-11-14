const r = require('express').Router();
const c = require('./controller');
r.get('/', c.grid);
module.exports = r;
