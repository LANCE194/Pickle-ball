const { query } = require('../../../../config/db');
const t = require('../../../../shared/services/tournaments');
const bracket = require('../../../../shared/services/bracket');
const tz = require('../../../../config/timezone');
exports.list = async user => { const rows = await t.list({ audience: 'player' }); const { rows: mine } = await query(`SELECT e.id, e.tournament_id, e.status FROM tournament_entries e JOIN players p ON (p.id=e.player_id OR p.id=e.partner_id) WHERE p.user_id=$1 AND e.status<>'withdrawn'`, [user.id]); const m = new Map(mine.map(x => [x.tournament_id, x])); return rows.map(r => ({ ...r, my_entry: m.get(r.id) || null })); };
exports.one = async (id, user) => { const tr = await t.get(id); const { rows } = await query(`SELECT e.*, (SELECT id FROM payments WHERE tournament_entry_id=e.id ORDER BY created_at DESC LIMIT 1) AS payment_id FROM tournament_entries e JOIN players p ON (p.id=e.player_id OR p.id=e.partner_id) WHERE p.user_id=$1 AND e.tournament_id=$2 AND e.status<>'withdrawn'`, [user.id, id]); return { tournament: tr, my_entry: rows[0] || null, standings: await bracket.standings(id) }; };
exports.register = async (id, user, b) => { const r = await t.register(id, user.id, b.partner_id || null); return { ...r, message: r.waitlisted ? 'The tournament is full. You are on the waitlist.' : (r.payment ? `You are registered. Pay ${tz.peso(r.payment.amount)} to confirm your spot.` : 'You are registered. Staff will approve your entry.') }; };
exports.withdraw = async (entryId, user) => { await t.withdraw(entryId, user.id); return { ok: true }; };
exports.matches = id => t.matches(id);
// Partner search shows names only (no personal data).
exports.partners = async (q = '', user) => (await query(`SELECT p.id, p.first_name||' '||p.last_name AS name, p.rating FROM players p WHERE p.user_id<>$2 AND p.archived_at IS NULL AND p.status IN ('active','pending_verification') AND lower(p.first_name||' '||p.last_name) LIKE '%'||lower($1)||'%' ORDER BY p.first_name LIMIT 20`, [q, user.id])).rows;
