// Elo-style skill rating. Ratings live on the pickleball 1.0 - 6.5 scale.
const { query } = require('../../config/db');
const K = 0.10;
const clamp = r => Math.min(6.5, Math.max(1.0, r));
const round2 = r => Math.round(r * 100) / 100;
const expected = (ra, rb) => 1 / (1 + Math.pow(10, rb - ra));
function levelFor(r) { return r >= 5.0 ? 'pro' : r >= 4.0 ? 'advanced' : r >= 3.0 ? 'intermediate' : 'beginner'; }
function newRatings(ra, rb, aWon) { const ea = expected(ra, rb); const sa = aWon ? 1 : 0; return { a: round2(clamp(ra + K * (sa - ea))), b: round2(clamp(rb + K * ((1 - sa) - (1 - ea)))) }; }
const team = async (db, entryId) => { const { rows } = await db.query('SELECT player_id, partner_id FROM tournament_entries WHERE id=$1', [entryId]); return rows[0] ? [rows[0].player_id, rows[0].partner_id].filter(Boolean) : []; };
/** Update ratings for every player on both sides after a confirmed match. */
async function applyMatchResult(db, matchId, winnerEntry, entryA, entryB, byUser) {
  const [ta, tb] = [await team(db, entryA), await team(db, entryB)]; if (!ta.length || !tb.length) return;
  const avg = async ids => { const { rows } = await db.query('SELECT id, rating FROM players WHERE id = ANY($1)', [ids]); return { rows, avg: rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length }; };
  const A = await avg(ta), B = await avg(tb); const aWon = winnerEntry === entryA; const nr = newRatings(A.avg, B.avg, aWon);
  const dA = nr.a - A.avg, dB = nr.b - B.avg;
  for (const [side, d] of [[A, dA], [B, dB]]) for (const p of side.rows) {
    const nv = round2(clamp(Number(p.rating) + d));
    await db.query('UPDATE players SET rating=$2, skill_level=$3, updated_at=now() WHERE id=$1', [p.id, nv, levelFor(nv)]);
    await db.query(`INSERT INTO rating_history (player_id, old_rating, new_rating, reason, match_id, changed_by) VALUES ($1,$2,$3,'Match result',$4,$5)`, [p.id, p.rating, nv, matchId, byUser]);
  }
}
module.exports = { expected, newRatings, levelFor, applyMatchResult };
