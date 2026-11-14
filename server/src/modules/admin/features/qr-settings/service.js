const qr = require('../../../../shared/services/qr');
const { audit } = require('../../../../shared/services/audit');
// Only admin / super_admin reach this folder (role router). Staff have no route here.
exports.list = () => qr.list();
exports.create = async (b, file, req) => { const x = await qr.create(b, file, req.user.id); await audit(req, 'qr.create', 'qr', x.id, { provider: x.provider }); return x; };
exports.update = async (id, b, file, req) => { const x = await qr.update(id, b, file, req.user.id); await audit(req, 'qr.update', 'qr', id, { replaced_image: !!file }); return x; };
exports.toggle = async (id, enabled, req) => { const x = await qr.setEnabled(id, !!enabled); await audit(req, 'qr.toggle', 'qr', id, { enabled: !!enabled }); return x; };
exports.remove = async (id, req) => { await qr.archive(id); await audit(req, 'qr.archive', 'qr', id); return { ok: true, message: 'QR code removed from the list.' }; };
