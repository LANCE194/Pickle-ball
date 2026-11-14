const { query } = require('../../config/db');
const tz = require('../../config/timezone');
/** Matches for the score desks. Each row shows Date, Time and Court name/number. */
async function list({ date = null, upcoming = false } = {}) {
  const d = date || tz.manilaDate(new Date()); const from = tz.manilaToUtc(d, '00:00'); const to = new Date(from.getTime() + (upcoming ? 7 : 1) * 86400000);
  const { rows } = await query(`SELECT m.id, m.status, m.round, m.bracket, m.pool, m.starts_at, m.ends_at, t.name AS tournament, c.name AS court_name, c.court_number,
    pa.first_name||' '||pa.last_name AS name_a, ppa.first_name||' '||ppa.last_name AS partner_a, pb.first_name||' '||pb.last_name AS name_b, ppb.first_name||' '||ppb.last_name AS partner_b,
    (SELECT json_group_array(json_object('game', s.game_no, 'a', s.score_a, 'b', s.score_b)) FROM match_scores s WHERE s.match_id=m.id) AS games
    FROM matches m JOIN tournaments t ON t.id=m.tournament_id LEFT JOIN courts c ON c.id=m.court_id LEFT JOIN tournament_entries ea ON ea.id=m.entry_a LEFT JOIN players pa ON pa.id=ea.player_id LEFT JOIN players ppa ON ppa.id=ea.partner_id
    LEFT JOIN tournament_entries eb ON eb.id=m.entry_b LEFT JOIN players pb ON pb.id=eb.player_id LEFT JOIN players ppb ON ppb.id=eb.partner_id
    WHERE m.starts_at >= $1 AND m.starts_at < $2 AND NOT m.is_bye ORDER BY m.starts_at, c.court_number`, [from, to]);
  const side = (n, p) => (n ? (p ? `${n} / ${p}` : n) : 'To be decided');
  return rows.map(m => ({ ...m, side_a: side(m.name_a, m.partner_a), side_b: side(m.name_b, m.partner_b), ready: !!(m.name_a && m.name_b), date_label: tz.formatDate(m.starts_at), time_label: tz.formatRange(m.starts_at, m.ends_at), court_label: `${m.court_name} (Court ${m.court_number})` }));
}
module.exports = { list };
