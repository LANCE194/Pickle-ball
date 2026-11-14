const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list()));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body, req.savedFile, req)));
exports.update = wrap(async (req, res) => res.json(await s.update(req.params.id, req.body, req.savedFile, req)));
exports.toggle = wrap(async (req, res) => res.json(await s.toggle(req.params.id, req.body.enabled, req)));
exports.remove = wrap(async (req, res) => res.json(await s.remove(req.params.id, req)));
