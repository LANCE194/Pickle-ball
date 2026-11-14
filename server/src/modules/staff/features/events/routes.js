const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.get('/', c.list);
r.post('/', perm('events_post'), c.create);
r.patch('/:id', perm('events_post'), c.update);
module.exports = r;
