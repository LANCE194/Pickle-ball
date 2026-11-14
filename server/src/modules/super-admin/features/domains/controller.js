const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (_req, res) => res.json(await s.list()));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body, req)));
exports.verifyDns = wrap(async (req, res) => res.json(await s.verifyDns(req.params.id, req)));
exports.confirmHttpsReady = wrap(async (req, res) => res.json(await s.confirmHttpsReady(req.params.id, req.body, req)));
exports.rotateChallenge = wrap(async (req, res) => res.json(await s.rotateChallenge(req.params.id, req)));
exports.enable = wrap(async (req, res) => res.json(await s.enable(req.params.id, req)));
exports.disable = wrap(async (req, res) => res.json(await s.disable(req.params.id, req)));
