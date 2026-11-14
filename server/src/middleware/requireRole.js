const { HttpError } = require('../shared/utils');
/** requireRole(['admin','super_admin']) - server-side role check; hiding menu items is NOT security. */
module.exports = roles => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please log in.', 'UNAUTHENTICATED'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
  next();
};
