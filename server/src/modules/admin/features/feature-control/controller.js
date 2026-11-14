const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.list = wrap(async (req, res) => res.json(await s.list(req)));
exports.toggle = wrap(async (req, res) => res.json(await s.toggle(req.params.key, req.body, req)));
exports.requests = wrap(async (req, res) => res.json(await s.requests(req.user, req)));
exports.request = wrap(async (req, res) => res.status(201).json(await s.request(req.body, req)));
exports.wizard = wrap(async (req, res) => res.json(await s.wizard(req)));
exports.applyWizard = wrap(async (req, res) => res.json(await s.applyWizard(req.body, req)));
