const tm = require('../../../../shared/services/todaymatches');
const bracket = require('../../../../shared/services/bracket');
const { audit } = require('../../../../shared/services/audit');
exports.list = ({ date, upcoming }) => tm.list({ date, upcoming: upcoming === 'true' });
exports.scores = async (id, games, req) => { await bracket.enterScores(id, games, req.user); await audit(req, 'match.score', 'match', id, { games }); return { ok: true, message: 'Score saved. The bracket is updated.' }; };
