const membership = require('../../../../shared/services/membership');
const players = require('../../../../shared/services/players');
const { audit } = require('../../../../shared/services/audit');
const tz = require('../../../../config/timezone');
exports.today = async ({ date }) => { const d = date || tz.manilaDate(new Date()); const rows = await membership.attendance({ date: d }); return { date: d, count: rows.length, rows }; };
exports.search = async q => (await players.list({ q: q || '', limit: 10 })).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, rating: p.rating, status: p.status }));
// Check-in by name (2 taps) or by scanning a player QR (method 'qr').
exports.checkIn = async ({ player_id, booking_id, method }, req) => { const p = await membership.checkIn(player_id, req.user, method === 'qr' ? 'qr' : 'name', booking_id || null); await audit(req, 'attendance.check_in', 'player', player_id); return { ok: true, message: `${p.first_name} ${p.last_name} is checked in.` }; };
