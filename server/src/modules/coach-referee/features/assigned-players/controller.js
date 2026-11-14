const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.user, req.query)));
exports.verify = wrap(async (req, res) => res.json(await s.verify(req.params.id, req.user, req.body.note)));
