const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.request = wrap(async (req, res) => res.json(await s.request(req.body.contact, req)));
exports.verify = wrap(async (req, res) => res.json(await s.verify(req.body, req)));
