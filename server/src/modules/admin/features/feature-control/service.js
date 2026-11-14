const { query } = require('../../../../config/db');
const feature = require('../../../../shared/services/feature');
const settings = require('../../../../shared/services/settings');
const notification = require('../../../../shared/services/notification');
const { audit } = require('../../../../shared/services/audit');
const { HttpError, cleanText } = require('../../../../shared/utils');
const decorate = f => ({ key: f.key, label: f.label, description: f.description, area: f.area, core: f.is_core, available: f.available, locked: f.locked, enabled: f.is_core || (f.available && f.enabled), requires: f.requires, status_text: f.is_core ? 'Always on' : !f.available ? 'Not available yet' : f.locked ? 'Locked by the Super Admin' : f.enabled ? 'On' : 'Off' });
const clubId = req => req.club && req.club.id;
exports.list = async req => (await feature.load(true, clubId(req))).map(decorate);
// 1 tap to switch; when other features depend on it the API answers 409 NEEDS_CONFIRM and the UI asks once, then repeats with cascade:true.
exports.toggle = async (key, { enabled, cascade }, req) => { const keys = await feature.setEnabled(key, !!enabled, req.user.id, { cascade: !!cascade, clubId: clubId(req) }); await audit(req, enabled ? 'feature.enable' : 'feature.disable', 'feature', key, { changed: keys }); return { ok: true, changed: keys }; };
exports.requests = async (user, req) => (await query('SELECT * FROM feature_requests WHERE club_id=$1 AND requested_by=$2 ORDER BY created_at DESC', [clubId(req), user.id])).rows;
exports.request = async (b, req) => {
  const e = {}; if (!b.title || !String(b.title).trim()) e.title = 'Give your request a short title.'; if (!b.description || !String(b.description).trim()) e.description = 'Tell us what you need.'; if (!['new feature', 'change', 'unlock'].includes(b.type)) e.type = 'Choose what kind of request this is.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
  if (req.user.role !== 'admin') throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); // only the Admin submits requests
  const { rows } = await query('INSERT INTO feature_requests (club_id, requested_by, title, description, type, priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [clubId(req), req.user.id, cleanText(b.title, 120), cleanText(b.description, 1500), b.type, ['low', 'normal', 'high'].includes(b.priority) ? b.priority : 'normal']);
  await notification.notifyRoles(['super_admin'], 'New feature request', cleanText(b.title, 120), 'feature'); await audit(req, 'feature.request', 'feature_request', rows[0].id); return rows[0];
};
exports.wizard = async req => ({ done: !!(await settings.get('setup_wizard_done', clubId(req))), features: (await exports.list(req)).filter(f => !f.core) });
exports.applyWizard = async ({ enabled = [] }, req) => {
  const tenantId = clubId(req);
  const all = (await feature.load(true, tenantId)).filter(f => !f.is_core && f.available && !f.locked);
  for (const f of all) { const want = enabled.includes(f.key); if (want !== f.enabled) { try { await feature.setEnabled(f.key, want, req.user.id, { cascade: true, clubId: tenantId }); } catch (e) { if (!(e instanceof HttpError)) throw e; } } }
  await settings.set('setup_wizard_done', true, req.user.id, tenantId); await audit(req, 'feature.wizard', 'feature', null, { enabled }); return { ok: true };
};
