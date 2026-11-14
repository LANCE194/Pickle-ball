const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.use(perm('members_edit'));
r.get('/', c.list);
r.post('/', c.create);
r.get('/:id', c.get);
r.patch('/:id', c.update);
r.post('/:id/resend-invite', c.resend);
r.post('/:id/reset-password', c.reset);
r.post('/:id/verify-level', c.verify);
r.post('/:id/archive', c.archive); // staff archive only: no permanent delete
module.exports = r;
