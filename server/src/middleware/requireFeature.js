const feature = require('../shared/services/feature');
const { HttpError } = require('../shared/utils');
/** requireFeature('tournaments') - returns 404 "Feature not available" when switched off. Data is kept. */
module.exports = key => async (req, res, next) => {
  try { if (await feature.isEnabled(key, req.club && req.club.id)) return next(); next(new HttpError(404, 'Feature not available', 'FEATURE_OFF')); } catch (e) { next(e); }
};
