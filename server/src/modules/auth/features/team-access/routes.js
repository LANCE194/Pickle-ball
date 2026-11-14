const r = require('express').Router();
const c = require('./controller');
const rate = require('../../../../middleware/rateLimit');
const validate = require('../../../../middleware/validate');
const v = require('./validator');
r.post('/login', rate.login, validate(v.login), c.login);
module.exports = r;
