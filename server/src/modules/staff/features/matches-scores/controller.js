const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.query)));
exports.scores = wrap(async (req, res) => res.json(await s.scores(req.params.id, req.body.games, req)));
