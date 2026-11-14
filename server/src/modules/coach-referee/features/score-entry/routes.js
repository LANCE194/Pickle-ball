const r = require('express').Router();
const c = require('./controller');
r.post('/:id', c.enter);
module.exports = r;
