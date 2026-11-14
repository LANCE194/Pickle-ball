const courts = require('../../../../shared/services/courts');
const { audit } = require('../../../../shared/services/audit');
// Price changes only affect NEW bookings: bookings store the price they were made at.
exports.list = ({ q, status, archived }) => courts.list({ q: q || '', status: status || '', includeArchived: archived === 'true' });
exports.create = async (b, req) => { const c = await courts.create(b); await audit(req, 'court.create', 'court', c.id); return c; };
exports.update = async (id, b, req) => { const c = await courts.update(id, b, courts.FIELDS_ADMIN); await audit(req, 'court.update', 'court', id, { fields: Object.keys(b) }); return c; };
exports.photo = async (id, file) => courts.setPhoto(id, file.path);
exports.archive = async (id, req) => { await courts.setArchived(id, true); await audit(req, 'court.archive', 'court', id); return { ok: true, message: 'Court removed from the list. You can bring it back later.' }; };
exports.restore = async (id, req) => { await courts.setArchived(id, false); await audit(req, 'court.restore', 'court', id); return { ok: true }; };
exports.blocks = court => courts.blocks(court || null);
exports.addBlock = async (id, b, req) => { const r = await courts.addBlock(id, b, req.user.id); await audit(req, 'court.block', 'court', id, b); return r; };
exports.removeBlock = async (id, req) => { await courts.removeBlock(id); await audit(req, 'court.unblock', 'court_block', id); return { ok: true }; };
