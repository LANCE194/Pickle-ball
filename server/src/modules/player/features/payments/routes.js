const r = require('express').Router();
const c = require('./controller');
const upload = require('../../../../middleware/upload');
const requireFeature = require('../../../../middleware/requireFeature');
r.get('/', c.list);
r.get('/qr/:qrId/image', requireFeature('qr_payments'), c.qrImage);
r.get('/:id', c.one);
r.post('/:id/proof', requireFeature('qr_payments'), ...upload('proofs'), c.proof); // JPG/PNG up to 5 MB, checked by file signature
r.post('/:id/pay-at-court', requireFeature('pay_at_court'), c.payAtCourt);
module.exports = r;
