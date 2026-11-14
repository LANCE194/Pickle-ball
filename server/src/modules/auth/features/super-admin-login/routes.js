const r = require('express').Router();
const c = require('./controller');
const rate = require('../../../../middleware/rateLimit');
const validate = require('../../../../middleware/validate');
const v = require('./validator');
const env = require('../../../../config/env');
// Optional IP allowlist (SUPER_ADMIN_IP_ALLOWLIST). Anything else looks like a missing page.
r.use((req, res, next) => (env.superAdminIpAllowlist.length && !env.superAdminIpAllowlist.includes(req.ip) ? res.status(404).json({ error: 'Not found' }) : next()));
r.use(rate.superAdmin);
r.post('/login', validate(v.login), c.login);
r.post('/setup/password', validate(v.setupPassword), c.setupPassword);
r.post('/setup/totp', validate(v.setupToken), c.setupTotp);
r.post('/setup/totp/confirm', validate(v.confirm), c.confirmTotp);
module.exports = r;
