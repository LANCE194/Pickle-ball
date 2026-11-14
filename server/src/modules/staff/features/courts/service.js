const courts = require('../../../../shared/services/courts');
const { audit } = require('../../../../shared/services/audit');
exports.list = ({ q, status }) => courts.list({ q: q || '', status: status || '' });
exports.update = async (id, b, req) => { const row = await courts.update(id, b, courts.FIELDS_STAFF); await audit(req, 'court.update', 'court', id, { fields: Object.keys(b) }); return row; };
