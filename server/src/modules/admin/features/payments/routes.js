const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.get('/:id/proof', c.proof);
r.post('/:id/approve', c.approve);
r.post('/:id/reject', c.reject);
r.post('/:id/paid-at-court', c.approve); // marks a pay-at-court payment as paid
module.exports = r;
