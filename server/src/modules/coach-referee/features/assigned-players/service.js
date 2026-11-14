const { query } = require('../../../../config/db');
const players = require('../../../../shared/services/players');
// View only: players inside the coach's assigned level range. Sensitive fields stay masked.
exports.list = async (user, { q = '' }) => { const { rows } = await query('SELECT level_min, level_max FROM referee_profiles WHERE user_id=$1', [user.id]); const r = rows[0] || {}; const all = await players.list({ q }); return all.filter(p => (r.level_min == null || Number(p.rating) >= Number(r.level_min)) && (r.level_max == null || Number(p.rating) <= Number(r.level_max))).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, rating: p.rating, skill_level: p.skill_level, level_verified: p.level_verified, status: p.status })); };
exports.verify = async (id, user, note) => { await players.verifyLevel(id, user, note); return { ok: true, message: 'Level confirmed.' }; };
