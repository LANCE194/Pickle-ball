const inq = require('../../../../shared/services/inquiries');
exports.list = ({ handled }) => inq.list({ handled: handled === undefined ? null : handled === 'true' });
exports.handled = (id, b, user) => inq.markHandled(id, user.id, b.handled !== false);
