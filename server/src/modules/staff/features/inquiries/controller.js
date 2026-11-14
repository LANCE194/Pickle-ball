const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.handled = wrap(async (req, res) => res.json(await s.handled(req.params.id, req.body, req.user)));
