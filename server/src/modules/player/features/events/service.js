const events = require('../../../../shared/services/events');
const membership = require('../../../../shared/services/membership');
const { query } = require('../../../../config/db');
// Players see public events; members also see members-only posts.
exports.list = async user => { const { rows } = await query('SELECT id FROM players WHERE user_id=$1', [user.id]); const m = rows[0] ? await membership.myMembership(rows[0].id) : null; return events.list(m && ['active', 'expiring'].includes(m.status) ? 'member' : 'guest'); };
