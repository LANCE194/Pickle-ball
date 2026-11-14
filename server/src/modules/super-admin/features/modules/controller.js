const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list()));
