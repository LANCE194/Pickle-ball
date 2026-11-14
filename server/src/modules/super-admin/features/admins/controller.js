const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list()));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body, req)));
exports.reset = wrap(async (req, res) => res.json(await s.reset(req.params.id, req)));
exports.status = wrap(async (req, res) => res.json(await s.status(req.params.id, req.body.status, req)));
