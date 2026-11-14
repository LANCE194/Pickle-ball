const r = require('express').Router();
const c = require('./controller');
const rate = require('../../../../middleware/rateLimit');
const validate = require('../../../../middleware/validate');
const v = require('./validator');
r.post('/request', rate.otp, validate(v.request), c.request); // step 1: contact -> code
r.post('/verify', rate.otp, validate(v.verify), c.verify);    // step 2+3: code + new password -> signed in
module.exports = r;
