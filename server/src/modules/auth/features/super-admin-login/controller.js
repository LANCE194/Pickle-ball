const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.login = wrap(async (req, res) => res.json(await s.login(req.body, req)));
exports.setupPassword = wrap(async (req, res) => res.json(await s.setupPassword(req.body, req)));
exports.setupTotp = wrap(async (req, res) => res.json(await s.setupTotp(req.body)));
exports.confirmTotp = wrap(async (req, res) => res.json(await s.confirmTotp(req.body, req)));
