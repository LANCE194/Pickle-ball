const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.mine = wrap(async (req, res) => res.json(await s.mine(req.user)));
exports.plans = wrap(async (req, res) => res.json(await s.plans()));
exports.join = wrap(async (req, res) => res.status(201).json(await s.join(req.body, req.user)));
