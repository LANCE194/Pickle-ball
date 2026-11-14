const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.get('/', c.list);
r.patch('/:id', perm('courts_edit'), c.update); // edit only: no create, no archive, no price changes
module.exports = r;
