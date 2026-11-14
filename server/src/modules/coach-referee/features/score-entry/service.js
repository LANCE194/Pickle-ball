const bracket = require('../../../../shared/services/bracket');
const { audit } = require('../../../../shared/services/audit');
const { query } = require('../../../../config/db');
// Coach/referee: enter and confirm match scores only. Winner advances automatically; changes are logged.
exports.enter = async (id, games, req) => { await bracket.enterScores(id, games, req.user); await query('UPDATE referee_profiles SET matches_officiated = matches_officiated + 1 WHERE user_id=$1', [req.user.id]); await audit(req, 'match.score', 'match', id, { games }); return { ok: true, message: 'Score saved. The winner moves on.' }; };
