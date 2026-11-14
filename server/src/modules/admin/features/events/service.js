const events = require('../../../../shared/services/events');
exports.list = ({ archived }) => events.list('staff', { includeArchived: archived === 'true' });
exports.create = (b, user) => events.save(b, user.id, null, { canPin: true });
exports.update = (id, b, user) => events.save(b, user.id, id, { canPin: true });
exports.image = (id, f) => events.setImage(id, f.path);
exports.archive = async (id, a) => { await events.setArchived(id, a); return { ok: true, message: a ? 'Removed from the list. You can bring it back later.' : 'Post restored.' }; };
