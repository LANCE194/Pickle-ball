const a = require('../../../../shared/services/authlogic');
// /team-access accepts admin, staff and coach_referee only. A player or super_admin gets the same generic error.
exports.login = async ({ email, password }, req) => { const u = await a.checkPassword(['admin', 'staff', 'coach_referee'], email, password, req); return a.openSession(u, req); };
