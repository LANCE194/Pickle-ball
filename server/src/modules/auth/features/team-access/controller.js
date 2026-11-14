const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.login = wrap(async (req, res) => res.json(await s.login(req.body, req)));
