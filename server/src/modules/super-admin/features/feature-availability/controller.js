const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list()));
exports.set = wrap(async (req, res) => res.json(await s.set(req.params.key, req.body, req)));
exports.requests = wrap(async (req, res) => res.json(await s.requests()));
exports.setRequest = wrap(async (req, res) => res.json(await s.setRequest(req.params.id, req.body, req)));
