const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.user)));
exports.one = wrap(async (req, res) => res.json(await s.one(req.params.id, req.user)));
exports.proof = wrap(async (req, res) => res.json(await s.proof(req.params.id, req.user, req.savedFile, req.body)));
exports.payAtCourt = wrap(async (req, res) => res.json(await s.payAtCourt(req.params.id, req.user)));
exports.qrImage = wrap(async (req, res) => res.sendFile(await s.qrFile(req.params.qrId)));
