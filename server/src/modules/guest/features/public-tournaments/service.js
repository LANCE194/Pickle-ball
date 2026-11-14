const t = require('../../../../shared/services/tournaments');
const bracket = require('../../../../shared/services/bracket');
exports.list = () => t.list({ audience: 'guest' });
// Guests see bracket, schedule and live standings; entries and payments stay private.
exports.detail = async id => ({ tournament: await t.get(id), matches: await t.matches(id), standings: await bracket.standings(id) });
