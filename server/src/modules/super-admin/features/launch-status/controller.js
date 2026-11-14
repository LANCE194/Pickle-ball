const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.get = wrap(async (req, res) => res.json(await s.get()));
exports.set = wrap(async (req, res) => res.json(await s.set(req.body.status, req)));
