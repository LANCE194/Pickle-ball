const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body, req)));
exports.permissions = wrap(async (req, res) => res.json(await s.permissions(req.params.userId, req.body, req)));
exports.reset = wrap(async (req, res) => res.json(await s.reset(req.params.userId, req)));
exports.status = wrap(async (req, res) => res.json(await s.status(req.params.userId, req.body.status, req)));
