const { audit } = require('../shared/services/audit');
/** auditAction('booking.cancel','booking') logs after a successful non-GET response. */
module.exports = (action, entity) => (req, res, next) => {
  res.on('finish', () => { if (res.statusCode < 400) audit(req, action, entity, req.params.id || null, { method: req.method, path: req.originalUrl.split('?')[0] }); });
  next();
};
