const site = require('../../../../shared/services/site');
const { audit } = require('../../../../shared/services/audit');
exports.get = async () => ({ launch_status: await site.launchStatus() });
exports.set = async (status, req) => { await site.setLaunch(status, req.user); await audit(req, 'site.launch_status', 'site_settings', null, { status }); return { launch_status: status }; };
