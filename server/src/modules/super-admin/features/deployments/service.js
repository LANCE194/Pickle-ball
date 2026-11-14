const site = require('../../../../shared/services/site');
const { query } = require('../../../../config/db');
const { audit } = require('../../../../shared/services/audit');
const { HttpError } = require('../../../../shared/utils');
// Only the Super Admin approves, deploys or rolls back a design.
exports.queue = () => site.queue();
exports.history = () => site.history();
exports.preview = async id => { const { rows } = await query('SELECT config_json, club_id FROM site_versions WHERE id=$1', [id]); if (!rows[0]) throw new HttpError(404, 'We could not find that design.'); return { config: rows[0].config_json, club_id: rows[0].club_id }; };
exports.act = async (action, id, note, req) => { await site.review(id, req.user, action, note); await audit(req, `site.${action}`, 'site_version', id, { note }); return { ok: true }; };
exports.deploy = async (id, req) => { const version = await site.deploy(id, req.user); await audit(req, 'site.deploy', 'site_version', id, { club_id: version.club_id, version_no: version.version_no }); return { ok: true, version: version.version_no }; };
exports.rollback = async (id, req) => { const v = await site.rollback(id, req.user); await audit(req, 'site.rollback', 'site_version', id, { new_version: v.version_no }); return { ok: true, version: v.version_no }; };
