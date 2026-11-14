const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.use(perm('payments'));
r.get('/', c.list);
r.get('/:id/proof', c.proof);
r.post('/:id/approve', c.approve);      // 2 taps: Approve, then done
r.post('/:id/reject', c.reject);
r.post('/:id/paid-at-court', c.paidAtCourt);
module.exports = r;
