const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.proof = wrap(async (req, res) => res.sendFile(await s.proof(req.params.id)));
exports.approve = wrap(async (req, res) => res.json(await s.approve(req.params.id, req)));
exports.reject = wrap(async (req, res) => res.json(await s.reject(req.params.id, req.body.reason, req)));
