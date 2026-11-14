const pq = require('../../../../shared/services/paymentqueue');
const payment = require('../../../../shared/services/payment');
const { audit } = require('../../../../shared/services/audit');
// Staff can verify payments but have NO route to change QR codes (those live under admin/qr-settings).
exports.list = pq.list;
exports.proof = pq.proofFile;
exports.approve = async (id, req) => { const p = await payment.approve(id, req.user); await audit(req, 'payment.approve', 'payment', id, { amount: p.amount }); return { ok: true, message: 'Payment accepted. The booking is confirmed.' }; };
exports.reject = async (id, reason, req) => { await payment.reject(id, req.user, reason); await audit(req, 'payment.reject', 'payment', id, { reason }); return { ok: true, message: 'Payment rejected. The player can send new proof.' }; };
