const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.get = wrap(async (_req, res) => res.json(await s.get()));
