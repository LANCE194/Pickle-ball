const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.today = wrap(async (req, res) => res.json(await s.today(req.query)));
exports.search = wrap(async (req, res) => res.json(await s.search(req.query.q)));
exports.checkIn = wrap(async (req, res) => res.status(201).json(await s.checkIn(req.body, req)));
