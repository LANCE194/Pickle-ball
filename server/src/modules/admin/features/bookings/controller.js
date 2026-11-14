const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.slots = wrap(async (req, res) => res.json(await s.slots(req.query)));
exports.walkIn = wrap(async (req, res) => res.status(201).json(await s.walkIn(req.body, req.user)));
exports.recurring = wrap(async (req, res) => res.status(201).json(await s.recurring(req.body, req.user)));
exports.move = wrap(async (req, res) => res.json(await s.move(req.params.id, req.body)));
exports.cancel = wrap(async (req, res) => res.json(await s.cancel(req.params.id, req.body, req.user)));
