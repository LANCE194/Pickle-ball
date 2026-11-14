const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.user)));
exports.one = wrap(async (req, res) => res.json(await s.one(req.params.id, req.user)));
exports.register = wrap(async (req, res) => res.status(201).json(await s.register(req.params.id, req.user, req.body)));
exports.withdraw = wrap(async (req, res) => res.json(await s.withdraw(req.params.entryId, req.user)));
exports.matches = wrap(async (req, res) => res.json(await s.matches(req.params.id)));
exports.partners = wrap(async (req, res) => res.json(await s.partners(req.query.q, req.user)));
