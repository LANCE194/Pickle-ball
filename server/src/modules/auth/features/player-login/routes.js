const r = require('express').Router();
const c = require('./controller');
const rate = require('../../../../middleware/rateLimit');
const validate = require('../../../../middleware/validate');
const v = require('./validator');
r.post('/login', rate.login, validate(v.login), c.login);
r.post('/forgot', rate.otp, validate(v.forgot), c.forgot);
r.post('/reset', rate.otp, validate(v.reset), c.reset);
module.exports = r;
