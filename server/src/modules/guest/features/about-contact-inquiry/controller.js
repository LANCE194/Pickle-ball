const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.about = wrap(async (req, res) => res.json(await s.about(req)));
exports.inquiry = wrap(async (req, res) => res.status(201).json(await s.inquiry(req.body)));
