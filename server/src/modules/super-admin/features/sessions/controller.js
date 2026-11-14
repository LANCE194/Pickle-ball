const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list()));
exports.revoke = wrap(async (req, res) => res.json(await s.revoke(req.params.id, req)));
