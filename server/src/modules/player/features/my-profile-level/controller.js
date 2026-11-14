const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.get = wrap(async (req, res) => res.json(await s.get(req)));
exports.update = wrap(async (req, res) => res.json(await s.update(req.body, req)));
exports.photo = wrap(async (req, res) => res.json(await s.photo(req.user, req.savedFile)));
exports.history = wrap(async (req, res) => res.json(await s.history(req.user)));
