const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.user)));
exports.read = wrap(async (req, res) => res.json(await s.read(req.user)));
