const r = require('express').Router();
const c = require('./controller');
const requireFeature = require('../../../../middleware/requireFeature');
r.use(requireFeature('tournaments'));
r.get('/', c.list);
r.get('/:id', c.detail);
module.exports = r;
