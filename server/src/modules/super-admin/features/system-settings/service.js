const cs = require('../../../../shared/services/clubsettings');
const { audit } = require('../../../../shared/services/audit');
exports.get = () => cs.get(cs.SUPER_KEYS);
exports.save = async (b, req) => { const r = await cs.save(b, cs.SUPER_KEYS, req.user.id); await audit(req, 'settings.system.update', 'settings', null, b); return r; };
