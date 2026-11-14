// Bracket / pool generation, court + time assignment, score handling and automatic advancement.
const { query, tx } = require('../../config/db');
const tz = require('../../config/timezone');
const settings = require('./settings');
const rating = require('./rating');
const realtime = require('../../realtime/gateway');
const booking = require('./booking');
const { HttpError } = require('../utils');
const HOUR = 3600000;
const nextPow2 = n => { let p = 1; while (p < n) p *= 2; return p; };
/** Standard seeding order so seed 1 meets seed 2 only in the final (1v8, 4v5, 2v7, 3v6 ...). */
function seedOrder(size) {
  let order = [1, 2];
  while (order.length < size) { const n = order.length * 2; order = order.flatMap(s => [s, n + 1 - s]); }
  return order;
}
const mk = (db, t, o) => db.query(`INSERT INTO matches (tournament_id, round, position, bracket, pool, entry_a, entry_b, is_bye) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
  [t, o.round, o.position, o.bracket || 'W', o.pool || null, o.a || null, o.b || null, !!o.bye]).then(r => r.rows[0].id);
const link = (db, from, to, slot) => db.query('UPDATE matches SET next_match_id=$2, next_slot=$3 WHERE id=$1', [from, to, slot]);
const linkLoser = (db, from, to, slot) => db.query('UPDATE matches SET loser_next_match_id=$2, loser_next_slot=$3 WHERE id=$1', [from, to, slot]);

async function buildSingle(db, tid, entries) {
  const size = nextPow2(entries.length); const order = seedOrder(size); const rounds = Math.log2(size);
  const bySeed = new Map(entries.map((e, i) => [i + 1, e.id]));
  const ids = [];
  for (let r = 1; r <= rounds; r++) { ids[r] = []; for (let p = 1; p <= size / 2 ** r; p++) ids[r][p] = await mk(db, tid, { round: r, position: p }); }
  for (let r = 1; r < rounds; r++) for (let p = 1; p <= size / 2 ** r; p++) await link(db, ids[r][p], ids[r + 1][Math.ceil(p / 2)], p % 2 ? 'a' : 'b');
  for (let p = 1; p <= size / 2; p++) {
    const a = bySeed.get(order[2 * p - 2]) || null, b = bySeed.get(order[2 * p - 1]) || null;
    await db.query('UPDATE matches SET entry_a=$2, entry_b=$3, is_bye=$4 WHERE id=$1', [ids[1][p], a, b, !(a && b)]);
  }
}
async function buildDouble(db, tid, entries) {
  const size = nextPow2(entries.length); if (size !== entries.length) throw new HttpError(422, 'Double elimination needs 4, 8, 16 or 32 approved entries. Please use single elimination or adjust the entries.');
  if (size < 4) throw new HttpError(422, 'Double elimination needs at least 4 entries.');
  const order = seedOrder(size); const n = Math.log2(size);
  const bySeed = new Map(entries.map((e, i) => [i + 1, e.id]));
  const W = [], L = [];
  for (let r = 1; r <= n; r++) { W[r] = []; for (let p = 1; p <= size / 2 ** r; p++) W[r][p] = await mk(db, tid, { round: r, position: p, bracket: 'W' }); }
  for (let r = 1; r < n; r++) for (let p = 1; p <= size / 2 ** r; p++) await link(db, W[r][p], W[r + 1][Math.ceil(p / 2)], p % 2 ? 'a' : 'b');
  for (let p = 1; p <= size / 2; p++) await db.query('UPDATE matches SET entry_a=$2, entry_b=$3 WHERE id=$1', [W[1][p], bySeed.get(order[2 * p - 2]), bySeed.get(order[2 * p - 1])]);
  const lbRounds = 2 * (n - 1);
  for (let r = 1; r <= lbRounds; r++) { L[r] = []; const count = size / 2 ** (Math.floor((r + 1) / 2) + 1); for (let p = 1; p <= count; p++) L[r][p] = await mk(db, tid, { round: r, position: p, bracket: 'L' }); }
  // WB round 1 losers pair up into LB round 1
  for (let p = 1; p <= size / 2; p++) await linkLoser(db, W[1][p], L[1][Math.ceil(p / 2)], p % 2 ? 'a' : 'b');
  // LB progression
  for (let r = 1; r < lbRounds; r++) {
    const cnt = L[r].length - 1; // arrays are 1-based
    for (let p = 1; p <= cnt; p++) {
      if (r % 2 === 1) await link(db, L[r][p], L[r + 1][p], 'a');           // odd round winner meets a WB loser
      else await link(db, L[r][p], L[r + 1][Math.ceil(p / 2)], p % 2 ? 'a' : 'b'); // even round winners pair up
    }
  }
  // WB round r (r>=2) losers drop into LB even round 2(r-1), slot b (reversed order to avoid rematches)
  for (let r = 2; r <= n; r++) { const target = L[2 * (r - 1)]; const cnt = W[r].length - 1; for (let p = 1; p <= cnt; p++) await linkLoser(db, W[r][p], target[cnt - p + 1], 'b'); }
  const F = await mk(db, tid, { round: 1, position: 1, bracket: 'F' });
  await link(db, W[n][1], F, 'a'); await link(db, L[lbRounds][1], F, 'b');
}
async function buildRoundRobin(db, tid, entries) {
  const pools = entries.length > 8 ? Math.ceil(entries.length / 6) : 1; const groups = Array.from({ length: pools }, () => []);
  entries.forEach((e, i) => { const row = Math.floor(i / pools); groups[row % 2 === 0 ? i % pools : pools - 1 - (i % pools)].push(e.id); }); // snake seeding
  for (let g = 0; g < pools; g++) {
    const ids = [...groups[g]]; if (ids.length % 2) ids.push(null); const n = ids.length; let pos = 1;
    for (let r = 1; r < n; r++) {
      for (let i = 0; i < n / 2; i++) { const a = ids[i], b = ids[n - 1 - i]; if (a && b) await mk(db, tid, { round: r, position: pos++, bracket: 'RR', pool: String.fromCharCode(65 + g), a, b }); }
      ids.splice(1, 0, ids.pop());
    }
  }
}
/** Push a winner into the next match; resolve byes. */
async function advanceBy(db, m, winner, loser) {
  if (m.next_match_id && winner) await db.query(`UPDATE matches SET ${m.next_slot === 'a' ? 'entry_a' : 'entry_b'}=$2 WHERE id=$1`, [m.next_match_id, winner]);
  if (m.loser_next_match_id && loser) await db.query(`UPDATE matches SET ${m.loser_next_slot === 'a' ? 'entry_a' : 'entry_b'}=$2 WHERE id=$1`, [m.loser_next_match_id, loser]);
}
async function resolveByes(db, tid) {
  for (let guard = 0; guard < 64; guard++) {
    const { rows } = await db.query(`SELECT * FROM matches WHERE tournament_id=$1 AND is_bye AND status='scheduled' AND (entry_a IS NOT NULL OR entry_b IS NOT NULL)`, [tid]);
    if (!rows.length) return;
    for (const m of rows) { const w = m.entry_a || m.entry_b; await db.query(`UPDATE matches SET winner_entry=$2, status='completed' WHERE id=$1`, [m.id, w]); await advanceBy(db, m, w, null); }
  }
}
/** Find the earliest free (court, hour) for a match; respects rest time and player conflicts. */
async function assignSlot(db, t, m, notBefore, courts, cfg, hours = 1) {
  const rest = cfg.tournament_rest_minutes * 60000; const players = await playersOf(db, [m.entry_a, m.entry_b]);
  let day = tz.manilaDate(new Date(Math.max(notBefore.getTime(), tz.manilaToUtc(t.starts_on.toString().slice(0, 10)).getTime())));
  for (let d = 0; d < 21; d++) {
    for (const c of courts) {
      const open = Number(String(c.opens_at).slice(0, 2)), close = Number(String(c.closes_at).slice(0, 2));
      for (let h = open; h + hours <= close; h++) {
        const s = tz.manilaToUtc(day, String(h).padStart(2, '0') + ':00'); if (s < notBefore) continue; const e = new Date(s.getTime() + hours * HOUR);
        if (players.length) {
          const { rows } = await db.query(`SELECT 1 FROM matches mm JOIN tournament_entries ea ON ea.id=mm.entry_a LEFT JOIN tournament_entries eb ON eb.id=mm.entry_b
            WHERE mm.id<>$1 AND mm.starts_at IS NOT NULL AND mm.starts_at < $3 AND mm.ends_at > $2
            AND (ea.player_id = ANY($4) OR ea.partner_id = ANY($4) OR eb.player_id = ANY($4) OR eb.partner_id = ANY($4)) LIMIT 1`, [m.id, new Date(s.getTime() - rest), new Date(e.getTime() + rest), players]);
          if (rows.length) continue;
        }
        try {
          await db.query('SAVEPOINT slot');
          const b = await booking.create({ courtId: c.id, startsAt: s, hours, bookedBy: t.created_by, walkIn: true, status: 'confirmed', tournamentMatchId: m.id, notes: `Tournament: ${t.name}` }, db);
          await db.query('RELEASE SAVEPOINT slot');
          await db.query('UPDATE matches SET court_id=$2, starts_at=$3, ends_at=$4 WHERE id=$1', [m.id, c.id, s, e]);
          return { court: c, start: s, end: e, bookingId: b.booking.id };
        } catch (err) { await db.query('ROLLBACK TO SAVEPOINT slot'); if (!(err instanceof HttpError) && err.code !== '23P01') throw err; }
      }
    }
    day = tz.manilaDate(new Date(tz.manilaToUtc(day).getTime() + 26 * HOUR));
  }
  throw new HttpError(409, 'There is not enough free court time to schedule every match. Add court time or unblock courts, then try again.');
}
async function playersOf(db, entryIds) {
  const ids = entryIds.filter(Boolean); if (!ids.length) return [];
  const { rows } = await db.query('SELECT player_id, partner_id FROM tournament_entries WHERE id = ANY($1)', [ids]);
  return rows.flatMap(r => [r.player_id, r.partner_id]).filter(Boolean);
}
async function generate(tournamentId, byUser) {
  return tx(async db => {
    const { rows: ts } = await db.query('SELECT * FROM tournaments WHERE id=$1 FOR UPDATE', [tournamentId]); const t = ts[0];
    if (!t) throw new HttpError(404, 'We could not find that tournament.');
    if (t.status !== 'registration_closed') throw new HttpError(409, 'Close registration first, then build the bracket.');
    const { rows: ex } = await db.query('SELECT 1 FROM matches WHERE tournament_id=$1 LIMIT 1', [tournamentId]); if (ex.length) throw new HttpError(409, 'The bracket was already built.');
    const { rows: entries } = await db.query(`SELECT e.id, p.rating FROM tournament_entries e JOIN players p ON p.id=e.player_id WHERE e.tournament_id=$1 AND e.status='approved' ORDER BY p.rating DESC, e.created_at`, [tournamentId]);
    if (entries.length < 2) throw new HttpError(422, 'At least 2 approved entries are needed.');
    for (let i = 0; i < entries.length; i++) await db.query('UPDATE tournament_entries SET seed=$2 WHERE id=$1', [entries[i].id, i + 1]);
    if (t.format === 'single_elimination') await buildSingle(db, tournamentId, entries);
    else if (t.format === 'double_elimination') await buildDouble(db, tournamentId, entries);
    else await buildRoundRobin(db, tournamentId, entries);
    await resolveByes(db, tournamentId);
    const cfg = await settings.getAll();
    const { rows: courts } = await db.query(`SELECT * FROM courts WHERE status='available' AND archived_at IS NULL ORDER BY court_number`);
    if (!courts.length) throw new HttpError(409, 'No court is available for the tournament.');
    const { rows: ms } = await db.query(`SELECT * FROM matches WHERE tournament_id=$1 AND status='scheduled' ORDER BY (CASE bracket WHEN 'RR' THEN 0 WHEN 'W' THEN 1 WHEN 'L' THEN 2 ELSE 3 END), round, position`, [tournamentId]);
    let roundFloor = new Map(); // bracket+round -> earliest start (previous round end + rest)
    const rest = cfg.tournament_rest_minutes * 60000; const rankOf = m => `${m.bracket}`;
    let prevKey = null, prevEnd = new Date(0);
    for (const m of ms) {
      const key = `${rankOf(m)}-${m.round}`; if (key !== prevKey) { prevKey = key; roundFloor.set(key, new Date(prevEnd.getTime() + (prevEnd.getTime() ? rest : 0))); }
      const slot = await assignSlot(db, t, m, roundFloor.get(key), courts, cfg);
      if (slot.end > prevEnd) prevEnd = slot.end;
    }
    await db.query(`UPDATE tournaments SET status='in_progress' WHERE id=$1`, [tournamentId]);
    realtime.publish('scores', 'bracket.changed', { tournament_id: tournamentId });
    realtime.publish('public:availability', 'availability.changed', {});
    return { matches: ms.length };
  });
}
const winsNeeded = 2; // best of 3 games to 11, win by 2
function validGame(a, b) { const hi = Math.max(a, b), lo = Math.min(a, b); return hi >= 11 && hi - lo >= 2 && (hi === 11 ? true : hi - lo === 2); }
/** Save scores for a match, decide the winner, advance, update ratings. Re-entering a score fixes the bracket (and is audited by the caller). */
async function enterScores(matchId, games, user) {
  if (!Array.isArray(games) || games.length < 2 || games.length > 3) throw new HttpError(422, 'Enter 2 or 3 games (best of 3).', 'VALIDATION');
  for (const [i, g] of games.entries()) if (!validGame(Number(g.a), Number(g.b))) throw new HttpError(422, `Game ${i + 1}: games go to 11 and must be won by 2.`, 'VALIDATION');
  let wa = 0, wb = 0; const used = [];
  for (const g of games) { if (wa === winsNeeded || wb === winsNeeded) throw new HttpError(422, 'The match was already decided - remove the extra game.', 'VALIDATION'); Number(g.a) > Number(g.b) ? wa++ : wb++; used.push(g); }
  if (wa < winsNeeded && wb < winsNeeded) throw new HttpError(422, 'Enter a third game - nobody has won 2 games yet.', 'VALIDATION');
  const out = await tx(async db => {
    const { rows } = await db.query('SELECT * FROM matches WHERE id=$1 FOR UPDATE', [matchId]); const m = rows[0];
    if (!m) throw new HttpError(404, 'We could not find that match.'); if (!m.entry_a || !m.entry_b) throw new HttpError(409, 'This match is waiting for players.');
    const winner = wa > wb ? m.entry_a : m.entry_b; const loser = wa > wb ? m.entry_b : m.entry_a;
    const wasDone = m.status === 'completed';
    if (wasDone && m.next_match_id) { // a changed score must not break a match that already started
      const { rows: nx } = await db.query('SELECT status FROM matches WHERE id=$1', [m.next_match_id]);
      if (nx[0] && nx[0].status === 'completed' && m.winner_entry !== winner) throw new HttpError(409, 'The next match was already played, so the winner cannot be changed here. Ask the admin to fix it.');
    }
    await db.query('DELETE FROM match_scores WHERE match_id=$1', [matchId]);
    for (const [i, g] of used.entries()) await db.query('INSERT INTO match_scores (match_id, game_no, score_a, score_b, entered_by, confirmed_by) VALUES ($1,$2,$3,$4,$5,$5)', [matchId, i + 1, g.a, g.b, user.id]);
    await db.query(`UPDATE matches SET winner_entry=$2, status='completed' WHERE id=$1`, [matchId, winner]);
    await advanceBy(db, m, winner, loser);
    if (!wasDone) await rating.applyMatchResult(db, matchId, winner, m.entry_a, m.entry_b, user.id);
    // make sure a freshly advanced player is not in two places at once
    for (const nid of [m.next_match_id, m.loser_next_match_id].filter(Boolean)) await fixConflicts(db, nid);
    const { rows: left } = await db.query(`SELECT 1 FROM matches WHERE tournament_id=$1 AND status<>'completed' AND NOT (is_bye AND entry_a IS NULL AND entry_b IS NULL) LIMIT 1`, [m.tournament_id]);
    if (!left.length && m.tournament_id) await db.query(`UPDATE tournaments SET status='completed' WHERE id=$1`, [m.tournament_id]);
    return { winner, tournamentId: m.tournament_id };
  });
  realtime.publish('scores', 'bracket.changed', { tournament_id: out.tournamentId, match_id: matchId });
  realtime.publish('public:availability', 'score.updated', { tournament_id: out.tournamentId });
  return out;
}
async function fixConflicts(db, matchId) {
  const { rows } = await db.query('SELECT * FROM matches WHERE id=$1', [matchId]); const m = rows[0]; if (!m || !m.starts_at) return;
  const players = await playersOf(db, [m.entry_a, m.entry_b]); if (!players.length) return;
  const cfg = await settings.getAll(); const rest = cfg.tournament_rest_minutes * 60000;
  const { rows: c } = await db.query(`SELECT 1 FROM matches mm JOIN tournament_entries ea ON ea.id=mm.entry_a LEFT JOIN tournament_entries eb ON eb.id=mm.entry_b
    WHERE mm.id<>$1 AND mm.starts_at IS NOT NULL AND mm.starts_at < $3 AND mm.ends_at > $2 AND (ea.player_id = ANY($4) OR ea.partner_id = ANY($4) OR eb.player_id = ANY($4) OR eb.partner_id = ANY($4)) LIMIT 1`,
    [m.id, new Date(m.starts_at.getTime() - rest), new Date(m.ends_at.getTime() + rest), players]);
  if (!c.length) return;
  const { rows: ts } = await db.query('SELECT * FROM tournaments WHERE id=$1', [m.tournament_id]);
  const { rows: courts } = await db.query(`SELECT * FROM courts WHERE status='available' AND archived_at IS NULL ORDER BY court_number`);
  await db.query(`UPDATE bookings SET status='cancelled', cancel_reason='Rescheduled (player conflict)', cancelled_at=now() WHERE tournament_match_id=$1 AND status<>'cancelled'`, [m.id]);
  await db.query('UPDATE matches SET starts_at=NULL, ends_at=NULL, court_id=NULL WHERE id=$1', [m.id]);
  await assignSlot(db, ts[0], m, new Date(m.ends_at.getTime() + rest), courts, cfg);
}
/** Standings for round robin pools and elimination results. */
async function standings(tournamentId) {
  const { rows } = await query(`SELECT m.*, (SELECT COALESCE(SUM(CASE WHEN s.score_a>s.score_b THEN 1 ELSE 0 END),0) FROM match_scores s WHERE s.match_id=m.id) AS games_a,
    (SELECT COALESCE(SUM(CASE WHEN s.score_b>s.score_a THEN 1 ELSE 0 END),0) FROM match_scores s WHERE s.match_id=m.id) AS games_b,
    (SELECT COALESCE(SUM(s.score_a),0) FROM match_scores s WHERE s.match_id=m.id) AS pts_a, (SELECT COALESCE(SUM(s.score_b),0) FROM match_scores s WHERE s.match_id=m.id) AS pts_b
    FROM matches m WHERE m.tournament_id=$1 AND m.status='completed' AND NOT m.is_bye`, [tournamentId]);
  const t = new Map(); const row = id => { if (!t.has(id)) t.set(id, { entry_id: id, played: 0, wins: 0, losses: 0, points_for: 0, points_against: 0 }); return t.get(id); };
  for (const m of rows) { const a = row(m.entry_a), b = row(m.entry_b); a.played++; b.played++; a.points_for += Number(m.pts_a); a.points_against += Number(m.pts_b); b.points_for += Number(m.pts_b); b.points_against += Number(m.pts_a); if (m.winner_entry === m.entry_a) { a.wins++; b.losses++; } else { b.wins++; a.losses++; } }
  const names = await query(`SELECT e.id, p.first_name||' '||p.last_name AS name, pp.first_name||' '||pp.last_name AS partner FROM tournament_entries e JOIN players p ON p.id=e.player_id LEFT JOIN players pp ON pp.id=e.partner_id WHERE e.tournament_id=$1`, [tournamentId]);
  const nm = new Map(names.rows.map(r => [r.id, r.partner ? `${r.name} / ${r.partner}` : r.name]));
  return [...t.values()].map(r => ({ ...r, name: nm.get(r.entry_id) })).sort((a, b) => b.wins - a.wins || (b.points_for - b.points_against) - (a.points_for - a.points_against));
}
module.exports = { generate, enterScores, standings, seedOrder, validGame, nextPow2 };
