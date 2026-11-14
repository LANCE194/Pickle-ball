const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.login = wrap(async (req, res) => res.json(await s.login(req.body, req)));
exports.forgot = wrap(async (req, res) => res.json(await s.forgot(req.body.contact, req)));
exports.reset = wrap(async (req, res) => res.json(await s.reset(req.body, req)));
