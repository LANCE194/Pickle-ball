const { HttpError } = require('../shared/utils');
/** validate(fn) - fn(req.body, req) returns an object of {field: 'plain-words message'}; empty means valid. */
module.exports = fn => (req, res, next) => {
  const errors = fn(req.body || {}, req) || {};
  if (Object.keys(errors).length) return next(Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: errors }));
  next();
};
