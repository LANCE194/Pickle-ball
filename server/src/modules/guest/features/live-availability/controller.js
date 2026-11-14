const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.grid = wrap(async (req, res) => res.json(await s.grid(req.query)));
