const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.slots = wrap(async (req, res) => res.json(await s.slots(req.query)));
exports.quote = wrap(async (req, res) => res.json(await s.quote(req.query, req.user)));
exports.last = wrap(async (req, res) => res.json(await s.last(req.user)));
exports.book = wrap(async (req, res) => res.status(201).json(await s.book(req.body, req.user)));
