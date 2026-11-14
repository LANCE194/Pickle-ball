const site = require('../../../../shared/services/site');
const { audit } = require('../../../../shared/services/audit');
const { query } = require('../../../../config/db');
const env = require('../../../../config/env');
const courts = require('../../../../shared/services/courts');
const events = require('../../../../shared/services/events');
const feature = require('../../../../shared/services/feature');
const { clubSubdomainHost } = require('../../../../shared/services/tenant');
const { HttpError } = require('../../../../shared/utils');
const isSuperAdmin = req => req.user && req.user.role === 'super_admin';
const clubId = req => {
  if (isSuperAdmin(req)) {
    const target = String(req.query.club_id || '').trim();
    if (!target) throw new HttpError(422, 'Choose a club before editing its site.', 'CLUB_REQUIRED');
    return target;
  }
  return req.user.clubId || (req.club && req.club.id);
};
const requireSuperAdmin = req => {
  if (!isSuperAdmin(req)) throw new HttpError(403, 'Only the Super Admin can choose a club site.', 'FORBIDDEN');
};
exports.options = () => ({ templates: site.TEMPLATES, fonts: site.FONTS, sectionKinds: site.SECTION_KINDS, defaults: site.DEFAULT_CONFIG });
exports.getDraft = async req => {
  const d = isSuperAdmin(req) ? await site.superAdminDraft(req.user, clubId(req)) : await site.currentDraft(req.user.id, clubId(req));
  return { id: d.id, status: d.status, config: d.config_json, review_note: d.review_note, updated_at: d.updated_at, publish_blocked: !!d.publish_blocked };
};
// Designs are validated JSON. No raw HTML, CSS or JavaScript can be stored.
exports.saveDraft = async (config, req) => {
  const d = isSuperAdmin(req) ? await site.saveSuperAdminDraft(config, req.user, clubId(req)) : await site.saveDraft(config, req.user, clubId(req));
  await audit(req, isSuperAdmin(req) ? 'site.super_admin.draft.save' : 'site.draft.save', 'site_version', d.id, { club_id: clubId(req) });
  return { id: d.id, status: d.status, saved_at: d.updated_at, config: d.config_json };
};
exports.discard = async req => {
  if (isSuperAdmin(req)) await site.discardSuperAdminDraft(req.user, clubId(req));
  else await site.discardDraft(req.user, clubId(req));
  await audit(req, isSuperAdmin(req) ? 'site.super_admin.draft.discard' : 'site.draft.discard', 'site_version', null, { club_id: clubId(req) });
  return { ok: true };
};
exports.submit = async (note, req) => {
  if (isSuperAdmin(req)) throw new HttpError(409, 'Use Publish changes to publish a Super Admin design.', 'USE_SUPER_ADMIN_PUBLISH');
  const id = await site.submit(req.user, note, clubId(req)); await audit(req, 'site.submit', 'site_version', id, { note }); return { ok: true, message: 'Sent to the Super Admin for review.' };
};
exports.history = req => site.history(clubId(req));
exports.preview = async req => isSuperAdmin(req) ? site.makeSuperAdminPreview(req.user, clubId(req)) : site.makePreview(req.user, clubId(req));
exports.previewGet = async (token, req) => ({ config: await site.previewConfig(token, clubId(req)) });
exports.media = req => site.media(clubId(req));
exports.addMedia = async (file, req) => { const m = await site.addMedia(file, req.user.id, clubId(req)); return { ...m, path: m.path, url: `/api/files/${m.path}` }; };
exports.clubs = async req => {
  requireSuperAdmin(req);
  const { rows } = await query(`SELECT c.id, c.name, c.slug, c.status,
    (SELECT host FROM club_domains d WHERE d.club_id=c.id AND d.verification_status='verified' AND d.https_ready=true ORDER BY d.created_at DESC LIMIT 1) AS custom_host
    FROM clubs c WHERE c.status <> 'archived' ORDER BY c.name`);
  return rows.map(club => {
    const host = env.multiClubEnabled ? (club.custom_host || clubSubdomainHost(club.slug)) : null;
    return { id: club.id, name: club.name, slug: club.slug, status: club.status, website_url: host ? `https://${host}` : null };
  });
};
exports.previewData = async (id, req) => {
  requireSuperAdmin(req);
  const { rows } = await query("SELECT id FROM clubs WHERE id=$1 AND status <> 'archived'", [id]);
  if (!rows.length) throw new HttpError(404, 'We could not find that club.');
  const [clubCourts, clubEvents] = await Promise.all([
    courts.list({ publicOnly: true, clubId: id }),
    feature.isEnabled('events_announcements', id) ? events.list('guest', { clubId: id }) : [],
  ]);
  return { courts: clubCourts, events: clubEvents.slice(0, 3) };
};
exports.publish = async req => {
  requireSuperAdmin(req);
  const version = await site.publishSuperAdminDraft(req.user, clubId(req));
  await audit(req, 'site.super_admin.publish', 'site_version', version.id, { club_id: version.club_id, version_no: version.version_no });
  return { ok: true, version: version.version_no };
};
