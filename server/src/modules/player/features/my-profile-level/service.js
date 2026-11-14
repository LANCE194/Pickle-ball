const players = require('../../../../shared/services/players');
const { audit } = require('../../../../shared/services/audit');
const rating = require('../../../../shared/services/rating');
const { ageFromBirthdate } = require('../../../../shared/utils');
// A player can edit ONLY their own profile, and only the allowed fields (not name parts, rating or status).
exports.get = async req => { const p = await players.mine(req.user.id); await audit(req, 'sensitive.view', 'player', p.id, { self: true }); return { profile: { ...p, age: ageFromBirthdate(p.birthdate) }, ...(await players.overview(p.id)), levels: [{ key: 'beginner', range: '1.0 - 2.5' }, { key: 'intermediate', range: '3.0 - 3.5' }, { key: 'advanced', range: '4.0 - 4.5' }, { key: 'pro', range: '5.0+' }] }; };
exports.update = async (b, req) => { const p = await players.mine(req.user.id); const body = { ...b }; if (body.skill_level && !['beginner', 'intermediate', 'advanced', 'pro'].includes(body.skill_level)) delete body.skill_level; await players.update(p.id, body, players.OWN_EDITABLE, req); return exports.get(req); };
exports.photo = async (user, file) => { const p = await players.mine(user.id); await players.setPhoto(p.id, file.path); return { ok: true, photo_path: file.path }; };
exports.history = async user => { const p = await players.mine(user.id); return { rating: p.rating, level: rating.levelFor(Number(p.rating)), history: await players.history(p.id) }; };
