const r = require('express').Router();
const c = require('./controller');
const rate = require('../../../../middleware/rateLimit');
const requireFeature = require('../../../../middleware/requireFeature');
r.get('/', c.about);
r.post('/inquiry', requireFeature('inquiries'), rate.inquiry, c.inquiry);
module.exports = r;
