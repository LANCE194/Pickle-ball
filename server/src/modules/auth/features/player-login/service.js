const a = require('../../../../shared/services/authlogic');
// Player Login accepts player accounts only. Any other account gets the same generic error.
exports.login = async ({ identifier, password }, req) => { const u = await a.checkPassword(['player'], identifier, password, req); return a.openSession(u, req); };
exports.forgot = (contact, req) => a.requestOtp(contact, 'reset', req);
exports.reset = async ({ contact, code, password }, req) => { await a.verifyOtp(contact, code, password, 'reset', req); return { ok: true, message: 'Your password was changed. You can log in now.' }; };
