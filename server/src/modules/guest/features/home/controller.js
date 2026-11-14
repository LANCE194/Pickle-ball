const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.home = wrap(async (req, res) => res.json(await s.home(req)));
