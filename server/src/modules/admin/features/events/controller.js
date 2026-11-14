const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body, req.user)));
exports.update = wrap(async (req, res) => res.json(await s.update(req.params.id, req.body, req.user)));
exports.image = wrap(async (req, res) => res.json(await s.image(req.params.id, req.savedFile)));
exports.archive = wrap(async (req, res) => res.json(await s.archive(req.params.id, true)));
exports.restore = wrap(async (req, res) => res.json(await s.archive(req.params.id, false)));
