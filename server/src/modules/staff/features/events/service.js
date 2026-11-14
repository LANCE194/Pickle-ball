const events = require('../../../../shared/services/events');
exports.list = () => events.list('staff');
exports.create = (b, user) => events.save(b, user.id, null, { canPin: false }); // staff post, only admin pins
exports.update = (id, b, user) => events.save(b, user.id, id, { canPin: false });
