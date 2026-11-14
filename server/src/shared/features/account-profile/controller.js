const s = require('./service');
const { wrap } = require('../../utils');
exports.get = wrap(async (req, res) => res.json(await s.get(req)));
exports.update = wrap(async (req, res) => res.json(await s.update(req.body, req)));
exports.photo = wrap(async (req, res) => res.json(await s.photo(req.user, req.savedFile, req)));
