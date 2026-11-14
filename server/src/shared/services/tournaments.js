const { query, tx } = require('../../config/db');
const { HttpError, cleanText, ageFromBirthdate } = require('../utils');
const tz = require('../../config/timezone');
const payment = require('./payment');
const notification = require('./notification');
const realtime = require('../../realtime/gateway');
const FORMATS = ['single_elimination', 'double_elimination', 'round_robin'];
const CATEGORIES = ['singles', 'doubles', 'mixed'];
function check(b) {
  const e = {};
  if (!b.name || !String(b.name).trim()) e.name = 'Give the tournament a name, for example March Open.';
  if (!b.starts_on) e.starts_on = 'Pick the first day.'; if (!b.ends_on) e.ends_on = 'Pick the last day.';
  if (b.starts_on && b.ends_on && b.ends_on < b.starts_on) e.ends_on = 'The last day cannot be before the first day.';
  if (!FORMATS.includes(b.format)) e.format = 'Choose a format.'; if (!CATEGORIES.includes(b.category)) e.category = 'Choose singles, doubles or mixed.';
  if (!(Number(b.max_slots) >= 2)) e.max_slots = 'Use at least 2 slots.';
  if (Number.isNaN(Number(b.entry_fee)) || Number(b.entry_fee) < 0) e.entry_fee = 'Use an amount like 300.00.';
  if (Number(b.level_min) > Number(b.level_max)) e.level_max = 'The top level must be at least the bottom level.';
  if (!b.registration_deadline_date) e.registration_deadline_date = 'Pick the last day to register.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
const decorate = t => ({ ...t, starts_label: tz.formatDate(t.starts_on + 'T00:00:00+08:00'), ends_label: tz.formatDate(t.ends_on + 'T00:00:00+08:00'), deadline_label: `${tz.formatDate(t.registration_deadline)}, ${tz.formatTime(t.registration_deadline)}`, fee_label: tz.peso(t.entry_fee) });
async function list({ audience = 'staff', includeDraft = false } = {}) {
  const pub = audience === 'guest' || audience === 'player';
  const { rows } = await query(`SELECT t.*, (SELECT count(*)::int FROM tournament_entries e WHERE e.tournament_id=t.id AND e.status='approved') AS approved_count,
    (SELECT count(*)::int FROM tournament_entries e WHERE e.tournament_id=t.id AND e.status='waitlisted') AS waitlist_count FROM tournaments t WHERE t.archived_at IS NULL AND ($1 OR t.status<>'draft') ${pub ? "AND t.status<>'cancelled'" : ''} ORDER BY t.starts_on DESC`, [includeDraft]);
  return rows.map(decorate);
}
async function get(id, { includeDraft = false } = {}) {
  const { rows } = await query('SELECT * FROM tournaments WHERE id=$1 AND archived_at IS NULL', [id]); const t = rows[0];
  if (!t || (t.status === 'draft' && !includeDraft)) throw new HttpError(404, 'We could not find that tournament.');
  return decorate(t);
}
async function save(b, user, id = null, { draftOnly = false } = {}) {
  check(b);
  const deadline = tz.manilaToUtc(b.registration_deadline_date, b.registration_deadline_time || '23:59');
  const v = [cleanText(b.name, 120), b.starts_on, b.ends_on, b.format, b.category, b.level_min ?? 1, b.level_max ?? 6, b.age_bracket || 'open', b.entry_fee ?? 0, b.max_slots, cleanText(b.rules, 4000), cleanText(b.prizes, 1000), deadline];
  if (id) {
    const { rows: cur } = await query('SELECT status FROM tournaments WHERE id=$1', [id]); if (!cur[0]) throw new HttpError(404, 'We could not find that tournament.');
    if (!['draft', 'registration_open'].includes(cur[0].status)) throw new HttpError(409, 'This tournament has already started, so its details are locked.');
    const { rows } = await query('UPDATE tournaments SET name=$2, starts_on=$3, ends_on=$4, format=$5, category=$6, level_min=$7, level_max=$8, age_bracket=$9, entry_fee=$10, max_slots=$11, rules=$12, prizes=$13, registration_deadline=$14 WHERE id=$1 RETURNING *', [id, ...v]); return rows[0];
  }
  const { rows } = await query(`INSERT INTO tournaments (name, starts_on, ends_on, format, category, level_min, level_max, age_bracket, entry_fee, max_slots, rules, prizes, registration_deadline, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14) RETURNING *`, [...v, user.id]);
  return rows[0];
}
const FLOW = { draft: ['registration_open', 'cancelled'], registration_open: ['registration_closed', 'cancelled'], registration_closed: ['registration_open', 'cancelled'], in_progress: ['cancelled'], completed: [], cancelled: [] };
async function setStatus(id, status, user) {
  const { rows } = await query('SELECT status FROM tournaments WHERE id=$1', [id]); if (!rows[0]) throw new HttpError(404, 'We could not find that tournament.');
  if (user.role === 'staff' && status !== 'draft') throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); // staff can only prepare drafts
  if (!(FLOW[rows[0].status] || []).includes(status)) throw new HttpError(409, 'That change is not possible at this stage.');
  const { rows: u } = await query('UPDATE tournaments SET status=$2 WHERE id=$1 RETURNING *', [id, status]); realtime.publish('public:availability', 'tournament.changed', { id }); return u[0];
}
/** Player joins solo or with a partner (partner must be an added player). Uses waitlist when full. Creates a payment for the QR flow. */
async function register(tournamentId, userId, partnerPlayerId = null) {
  return tx(async db => {
    const { rows: ts } = await db.query('SELECT * FROM tournaments WHERE id=$1 AND archived_at IS NULL FOR UPDATE', [tournamentId]); const t = ts[0];
    if (!t || t.status !== 'registration_open') throw new HttpError(409, 'Registration is not open for this tournament.');
    if (new Date(t.registration_deadline) < new Date()) throw new HttpError(409, 'The registration deadline has passed.');
    const { rows: ps } = await db.query('SELECT * FROM players WHERE user_id=$1 AND archived_at IS NULL', [userId]); const p = ps[0]; if (!p) throw new HttpError(404, 'We could not find your player profile.');
    if (p.status === 'suspended') throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
    const bad = (x, who) => { if (Number(x.rating) < Number(t.level_min) || Number(x.rating) > Number(t.level_max)) return `${who} rating ${x.rating} is outside this tournament's level range (${t.level_min} to ${t.level_max}).`; const age = ageFromBirthdate(x.birthdate); const m = /^(\d+)\+$/.exec(t.age_bracket || ''); if (m && (age === null || age < Number(m[1]))) return `${who} must be ${m[1]} or older for this category.`; return null; };
    let msg = bad(p, 'Your'); if (msg) throw new HttpError(409, msg, 'LEVEL');
    if (t.category !== 'singles') {
      if (!partnerPlayerId) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { partner_id: 'Choose your partner. They must already be added to the club.' } });
      if (partnerPlayerId === p.id) throw new HttpError(422, 'Your partner must be a different player.');
      const { rows: pp } = await db.query(`SELECT * FROM players WHERE id=$1 AND archived_at IS NULL AND status IN ('active','pending_verification')`, [partnerPlayerId]); if (!pp[0]) throw new HttpError(404, 'We could not find that partner. Ask the front desk to add them first.');
      msg = bad(pp[0], 'Your partner\'s'); if (msg) throw new HttpError(409, msg, 'LEVEL');
      const { rows: dup } = await db.query(`SELECT 1 FROM tournament_entries WHERE tournament_id=$1 AND status<>'withdrawn' AND (player_id=$2 OR partner_id=$2)`, [tournamentId, partnerPlayerId]); if (dup.length) throw new HttpError(409, 'Your partner is already registered.');
    }
    const { rows: me } = await db.query(`SELECT 1 FROM tournament_entries WHERE tournament_id=$1 AND status<>'withdrawn' AND (player_id=$2 OR partner_id=$2)`, [tournamentId, p.id]); if (me.length) throw new HttpError(409, 'You are already registered.');
    const { rows: cnt } = await db.query(`SELECT count(*)::int AS n FROM tournament_entries WHERE tournament_id=$1 AND status IN ('pending','approved')`, [tournamentId]);
    const full = cnt[0].n >= t.max_slots;
    await db.query(`DELETE FROM tournament_entries WHERE tournament_id=$1 AND player_id=$2 AND status='withdrawn'`, [tournamentId, p.id]);
    const { rows } = await db.query(`INSERT INTO tournament_entries (tournament_id, player_id, partner_id, status) VALUES ($1,$2,$3,$4) RETURNING *`, [tournamentId, p.id, partnerPlayerId, full ? 'waitlisted' : 'pending']);
    const pay = !full && Number(t.entry_fee) > 0 ? await payment.createFor({ entryId: rows[0].id, playerId: p.id, amount: t.entry_fee }, db) : null;
    return { entry: rows[0], payment: pay, waitlisted: full };
  });
}
async function entries(tournamentId) {
  const { rows } = await query(`SELECT e.*, p.first_name||' '||p.last_name AS player_name, p.rating, pp.first_name||' '||pp.last_name AS partner_name,
    (SELECT status FROM payments WHERE tournament_entry_id=e.id ORDER BY created_at DESC LIMIT 1) AS payment_status FROM tournament_entries e JOIN players p ON p.id=e.player_id LEFT JOIN players pp ON pp.id=e.partner_id WHERE e.tournament_id=$1 ORDER BY e.created_at`, [tournamentId]);
  return rows;
}
/** Staff/admin decision on an entry. Approving a waitlisted/pending entry keeps the slot count honest. */
async function decideEntry(entryId, status) {
  if (!['approved', 'rejected', 'waitlisted'].includes(status)) throw new HttpError(422, 'Choose approve, reject or waitlist.');
  return tx(async db => {
    const { rows } = await db.query('SELECT e.*, t.max_slots, t.status AS tstatus FROM tournament_entries e JOIN tournaments t ON t.id=e.tournament_id WHERE e.id=$1 FOR UPDATE OF e', [entryId]); const e = rows[0]; if (!e) throw new HttpError(404, 'We could not find that entry.');
    if (!['draft', 'registration_open', 'registration_closed'].includes(e.tstatus)) throw new HttpError(409, 'The tournament has already started.');
    if (status === 'approved') { const { rows: c } = await db.query(`SELECT count(*)::int AS n FROM tournament_entries WHERE tournament_id=$1 AND status='approved' AND id<>$2`, [e.tournament_id, entryId]); if (c[0].n >= e.max_slots) throw new HttpError(409, 'All slots are taken. Waitlist this entry instead.'); }
    const { rows: u } = await db.query('UPDATE tournament_entries SET status=$2 WHERE id=$1 RETURNING *', [entryId, status], undefined);
    const { rows: pl } = await db.query('SELECT user_id FROM players WHERE id=$1', [e.player_id]);
    return { entry: u[0], userId: pl[0] && pl[0].user_id };
  }).then(async r => { if (r.userId) await notification.notify(r.userId, `Tournament entry ${status}`, `Your tournament entry was ${status}.`, 'tournament'); return r.entry; });
}
/** After someone withdraws or is rejected, promote the first waitlisted entry. */
async function promoteWaitlist(tournamentId) {
  const { rows } = await query(`SELECT e.id, e.player_id, t.entry_fee FROM tournament_entries e JOIN tournaments t ON t.id=e.tournament_id WHERE e.tournament_id=$1 AND e.status='waitlisted' ORDER BY e.created_at LIMIT 1`, [tournamentId]);
  if (!rows[0]) return null; await query(`UPDATE tournament_entries SET status='pending' WHERE id=$1`, [rows[0].id]);
  if (Number(rows[0].entry_fee) > 0) await payment.createFor({ entryId: rows[0].id, playerId: rows[0].player_id, amount: rows[0].entry_fee });
  const { rows: u } = await query('SELECT user_id FROM players WHERE id=$1', [rows[0].player_id]); if (u[0]) await notification.notify(u[0].user_id, 'A spot opened up', 'You moved off the waitlist. Please pay your entry fee.', 'tournament');
  return rows[0];
}
async function withdraw(entryId, userId) {
  const { rows } = await query(`UPDATE tournament_entries e SET status='withdrawn' FROM players p WHERE e.id=$1 AND p.id=e.player_id AND p.user_id=$2 AND e.status IN ('pending','approved','waitlisted') RETURNING e.*`, [entryId, userId]);
  if (!rows[0]) throw new HttpError(404, 'We could not find that entry.'); await promoteWaitlist(rows[0].tournament_id); return rows[0];
}
/** Matches with Date, Time, Court name/number (rule E). Guests see public tournaments only. */
async function matches(tournamentId) {
  const { rows } = await query(`SELECT m.*, c.name AS court_name, c.court_number,
    pa.first_name||' '||pa.last_name AS name_a, ppa.first_name||' '||ppa.last_name AS partner_a, pb.first_name||' '||pb.last_name AS name_b, ppb.first_name||' '||ppb.last_name AS partner_b,
    (SELECT json_group_array(json_object('game', s.game_no, 'a', s.score_a, 'b', s.score_b)) FROM match_scores s WHERE s.match_id=m.id) AS games
    FROM matches m LEFT JOIN courts c ON c.id=m.court_id LEFT JOIN tournament_entries ea ON ea.id=m.entry_a LEFT JOIN players pa ON pa.id=ea.player_id LEFT JOIN players ppa ON ppa.id=ea.partner_id
    LEFT JOIN tournament_entries eb ON eb.id=m.entry_b LEFT JOIN players pb ON pb.id=eb.player_id LEFT JOIN players ppb ON ppb.id=eb.partner_id
    WHERE m.tournament_id=$1 ORDER BY (CASE m.bracket WHEN 'RR' THEN 0 WHEN 'W' THEN 1 WHEN 'L' THEN 2 ELSE 3 END), m.round, m.position`, [tournamentId]);
  const side = (n, p) => (n ? (p ? `${n} / ${p}` : n) : null);
  return rows.map(m => ({ ...m, side_a: side(m.name_a, m.partner_a), side_b: side(m.name_b, m.partner_b), date_label: m.starts_at ? tz.formatDate(m.starts_at) : null, time_label: m.starts_at ? tz.formatRange(m.starts_at, m.ends_at) : null, court_label: m.court_name ? `${m.court_name} (Court ${m.court_number})` : null }));
}
module.exports = { list, get, save, setStatus, register, entries, decideEntry, withdraw, promoteWaitlist, matches, decorate };
