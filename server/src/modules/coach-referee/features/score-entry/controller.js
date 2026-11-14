const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.enter = wrap(async (req, res) => res.json(await s.enter(req.params.id, req.body.games, req)));
