const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req.user, req.query)));
exports.activity = wrap(async (req, res) => res.json(await s.activity(req.user, req.user.clubId)));
exports.cancel = wrap(async (req, res) => res.json(await s.cancel(req.params.id, req.user)));
