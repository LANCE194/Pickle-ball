const cs = require('../../../../shared/services/clubsettings');
const { audit } = require('../../../../shared/services/audit');
exports.get = () => cs.get(cs.ADMIN_KEYS); // booking rules and hours. Security settings belong to the Super Admin.
exports.save = async (b, req) => { const r = await cs.save(b, cs.ADMIN_KEYS, req.user.id); await audit(req, 'settings.update', 'settings', null, b); return r; };
