const a = require('../../../../shared/services/authlogic');
// Closed registration: only players the club already added (status invited) can activate. Unknown contacts get a generic message.
exports.request = (contact, req) => a.requestOtp(contact, 'activation', req);
exports.verify = async ({ contact, code, password }, req) => {
  const u = await a.verifyOtp(contact, code, password, 'activation', req);
  const fresh = await a.findUser(contact, (req && req.club && req.club.id) || null);
  return a.openSession(fresh || u, req);
};
