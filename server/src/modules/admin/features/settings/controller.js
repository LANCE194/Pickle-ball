const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.get = wrap(async (req, res) => res.json(await s.get()));
exports.save = wrap(async (req, res) => res.json(await s.save(req.body, req)));
