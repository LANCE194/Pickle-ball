// Site Designer: designs are validated JSON, never raw HTML/CSS/JS. Admin edits drafts; only the Super Admin deploys.
const { query, tx } = require('../../config/db');
const { HttpError, cleanText, randomToken } = require('../utils');
const notification = require('./notification');
const realtime = require('../../realtime/gateway');
const { DEFAULT_CLUB_ID } = require('./tenant');
const TEMPLATES = ['classic', 'sporty', 'minimal'];
const SECTION_KINDS = ['hero', 'courts_rates', 'events', 'gallery', 'about_contact', 'testimonials', 'footer'];
const FONTS = ['Poppins', 'Inter', 'Nunito', 'Montserrat', 'Source Sans 3'];
const DEFAULT_CONFIG = {
  brand: {
    name: 'DinkNest',
    meaning: "Dink is pickleball's soft game; nest is a welcoming home. DinkNest is a home court where players connect, play, and grow.",
  },
  template: 'classic', theme: { primary: '#0B6E4F', accent: '#C6F432', background: '#F6F8F5', text: '#0B1F3A', headingFont: 'Poppins', bodyFont: 'Inter' },
  logo: null, banner: { enabled: false, text: '' },
  menu: { home: 'Home', courts: 'Courts and Rates', schedule: 'Schedule', events: 'Events', tournaments: 'Tournaments', about: 'About / Contact', login: 'Player Login' },
  sections: [
    { id: 'hero', kind: 'hero', visible: true, content: { title: 'Book. Play. Compete.', subtitle: 'Reserve a pickleball court in three taps.', button: 'Book Now', image: null } },
    { id: 'courts', kind: 'courts_rates', visible: true, content: { title: 'Courts and rates' } },
    { id: 'events', kind: 'events', visible: true, content: { title: 'Events and tournaments' } },
    { id: 'gallery', kind: 'gallery', visible: false, content: { title: 'Gallery', images: [] } },
    { id: 'testimonials', kind: 'testimonials', visible: false, content: { title: 'What players say', items: [] } },
    { id: 'about', kind: 'about_contact', visible: true, content: { title: 'Visit us', text: 'Come play with us.', address: '', phone: '', email: '', mapQuery: '' } },
    { id: 'footer', kind: 'footer', visible: true, content: { text: 'DinkNest', links: [] } },
  ],
  social: { facebook: '', instagram: '', tiktok: '' }, seo: { title: 'DinkNest - Book. Play. Compete.', description: 'Pickleball court booking, tournaments and club membership.' },
};
function luminance(hex) { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const HEX = /^#[0-9A-Fa-f]{6}$/;
const t = (v, max) => cleanText(v, max);
const DEFAULT_CLUB_MEANING = 'A welcoming home court where players connect, play, and grow together.';
function defaultClubBrand(clubName) {
  const name = t(clubName, 80) || DEFAULT_CONFIG.brand.name;
  return {
    name,
    meaning: name.toLowerCase() === 'dinknest' ? DEFAULT_CONFIG.brand.meaning : DEFAULT_CLUB_MEANING,
  };
}
function withClubBrand(value, clubName) {
  const config = JSON.parse(JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value || DEFAULT_CONFIG));
  const fallback = defaultClubBrand(clubName);
  const legacyBrand = !config.brand;
  config.brand = {
    name: t(config.brand && config.brand.name, 80) || fallback.name,
    meaning: t(config.brand && config.brand.meaning, 240) || fallback.meaning,
  };
  if (legacyBrand && config.brand.name !== 'DinkNest') {
    const footer = config.sections && config.sections.find(section => section.kind === 'footer');
    if (footer && footer.content && footer.content.text === 'DinkNest') footer.content.text = config.brand.name;
    if (config.seo && config.seo.title === DEFAULT_CONFIG.seo.title) config.seo.title = `${config.brand.name} - Book. Play. Compete.`;
  }
  return config;
}
const url = v => { const s = String(v || '').trim(); if (!s) return ''; if (!/^https:\/\/[^\s<>"']+$/.test(s)) throw bad('Links must start with https://'); return s.slice(0, 300); };
const bad = m => Object.assign(new HttpError(422, m, 'VALIDATION'), { fields: { config: m } });
const img = v => { if (!v) return null; if (!/^media\/[0-9a-f-]+\.(jpg|png)$/.test(String(v))) throw bad('Pictures must be uploaded through the media library (JPG or PNG).'); return v; };
/** Validates and sanitizes the full config. Anything not whitelisted is dropped. */
function validate(input) {
  if (!input || typeof input !== 'object') throw bad('The design is empty.');
  const d = DEFAULT_CONFIG; const out = {};
  if (input.brand && (!t(input.brand.name, 80) || !t(input.brand.meaning, 240))) {
    throw bad('Enter both your club display name and what it means.');
  }
  out.brand = {
    name: t(input.brand && input.brand.name, 80) || d.brand.name,
    meaning: t(input.brand && input.brand.meaning, 240) || d.brand.meaning,
  };
  out.template = TEMPLATES.includes(input.template) ? input.template : (() => { throw bad('Choose one of the 3 layouts.'); })();
  const th = input.theme || {}; out.theme = {};
  for (const k of ['primary', 'accent', 'background', 'text']) { if (!HEX.test(th[k] || '')) throw bad(`Pick a valid colour for ${k}.`); out.theme[k] = th[k].toUpperCase(); }
  for (const k of ['headingFont', 'bodyFont']) { if (!FONTS.includes(th[k])) throw bad('Choose a font from the list.'); out.theme[k] = th[k]; }
  if (contrast(out.theme.text, out.theme.background) < 4.5) throw bad('Text and background colours are too close. Pick colours with more contrast.');
  if (contrast('#FFFFFF', out.theme.primary) < 4.5) throw bad('The main colour is too light for white button text. Pick a darker colour.');
  out.logo = img(input.logo); out.banner = { enabled: !!(input.banner && input.banner.enabled), text: t(input.banner && input.banner.text, 160) };
  out.menu = {}; for (const k of Object.keys(d.menu)) out.menu[k] = t((input.menu || {})[k] || d.menu[k], 30) || d.menu[k];
  if (!Array.isArray(input.sections) || input.sections.length > 20) throw bad('The sections list is not valid.');
  const seen = new Set(); out.sections = input.sections.map(s => {
    if (!SECTION_KINDS.includes(s.kind)) throw bad('Unknown section type.'); const id = t(s.id, 40) || s.kind; if (seen.has(id)) throw bad('Two sections share the same name.'); seen.add(id);
    const c = s.content || {}; const content = { title: t(c.title, 120) };
    if (s.kind === 'hero') Object.assign(content, { subtitle: t(c.subtitle, 200), button: t(c.button, 30), image: img(c.image) });
    if (s.kind === 'gallery') content.images = (Array.isArray(c.images) ? c.images : []).slice(0, 12).map(img).filter(Boolean);
    if (s.kind === 'testimonials') content.items = (Array.isArray(c.items) ? c.items : []).slice(0, 8).map(i => ({ name: t(i.name, 60), text: t(i.text, 300) }));
    if (s.kind === 'about_contact') Object.assign(content, { text: t(c.text, 800), address: t(c.address, 200), phone: t(c.phone, 40), email: t(c.email, 120), mapQuery: t(c.mapQuery, 160) });
    if (s.kind === 'footer') {
      const footerText = t(c.text, 200);
      Object.assign(content, {
        text: footerText === 'DinkNest' && out.brand.name !== 'DinkNest' ? out.brand.name : footerText,
        links: (Array.isArray(c.links) ? c.links : []).slice(0, 8).map(l => ({ label: t(l.label, 40), url: url(l.url) })),
      });
    }
    return { id, kind: s.kind, visible: s.visible !== false, content };
  });
  out.social = {}; for (const k of ['facebook', 'instagram', 'tiktok']) out.social[k] = url((input.social || {})[k]);
  const seoTitle = t((input.seo || {}).title, 70) || d.seo.title;
  out.seo = {
    title: seoTitle === d.seo.title && out.brand.name !== 'DinkNest' ? `${out.brand.name} - Book. Play. Compete.`.slice(0, 70) : seoTitle,
    description: t((input.seo || {}).description, 160),
  };
  return out;
}
const scope = clubId => clubId || DEFAULT_CLUB_ID;
async function ensureBase(clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  await query('INSERT INTO site_settings (club_id, id) VALUES ($1, 1) ON CONFLICT (club_id, id) DO NOTHING', [tenantId]);
  const { rows } = await query(`SELECT 1 FROM site_versions WHERE club_id=$1 AND status='live' LIMIT 1`, [tenantId]);
  if (!rows.length) {
    const { rows: clubs } = await query('SELECT name FROM clubs WHERE id=$1', [tenantId]);
    const clubName = tenantId === DEFAULT_CLUB_ID ? 'DinkNest' : clubs[0] && clubs[0].name;
    const brand = defaultClubBrand(clubName);
    const config = {
      ...DEFAULT_CONFIG,
      brand,
      seo: { ...DEFAULT_CONFIG.seo, title: `${brand.name} - Book. Play. Compete.` },
      sections: DEFAULT_CONFIG.sections.map(section => section.kind === 'footer'
        ? { ...section, content: { ...section.content, text: brand.name } }
        : section),
    };
    await query(`INSERT INTO site_versions (club_id, version_no, status, config_json, note, deployed_at)
      VALUES ($1, (SELECT COALESCE(MAX(version_no),0)+1 FROM site_versions WHERE club_id=$1), 'live', $2, 'Default design', now())`,
    [tenantId, JSON.stringify(config)]);
  }
}
const launchStatus = async (clubId = DEFAULT_CLUB_ID) => {
  const tenantId = scope(clubId);
  await ensureBase(tenantId);
  return (await query('SELECT launch_status FROM site_settings WHERE club_id=$1 AND id=1', [tenantId])).rows[0].launch_status;
};
/** Public site: ONLY the live version, never a draft. In pre_launch the public gets the Coming Soon marker. */
async function publicConfig(clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  await ensureBase(tenantId); const status = await launchStatus(tenantId);
  const { rows } = await query(`SELECT config_json, version_no FROM site_versions
    WHERE club_id=$1 AND status='live' ORDER BY deployed_at DESC LIMIT 1`, [tenantId]);
  const { rows: clubs } = await query('SELECT name FROM clubs WHERE id=$1', [tenantId]);
  const clubName = tenantId === DEFAULT_CLUB_ID ? 'DinkNest' : clubs[0] && clubs[0].name;
  return { launch_status: status, config: withClubBrand(rows[0].config_json, clubName), version: rows[0].version_no, coming_soon: status === 'pre_launch' };
}
async function currentDraft(userId, clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  await ensureBase(tenantId);
  const { rows } = await query(`SELECT * FROM site_versions WHERE club_id=$1 AND created_by=$2
    AND status IN ('draft','changes_requested','submitted') ORDER BY updated_at DESC LIMIT 1`, [tenantId, userId]);
  const { rows: clubs } = await query('SELECT name FROM clubs WHERE id=$1', [tenantId]);
  const clubName = tenantId === DEFAULT_CLUB_ID ? 'DinkNest' : clubs[0] && clubs[0].name;
  if (rows[0]) return { ...rows[0], config_json: withClubBrand(rows[0].config_json, clubName) };
  const live = (await query(`SELECT config_json FROM site_versions WHERE club_id=$1 AND status='live' ORDER BY deployed_at DESC LIMIT 1`, [tenantId])).rows[0];
  return (await query(`INSERT INTO site_versions (club_id, version_no, status, config_json, created_by)
    VALUES ($1, (SELECT COALESCE(MAX(version_no),0)+1 FROM site_versions WHERE club_id=$1), 'draft', $2, $3) RETURNING *`,
  [tenantId, JSON.stringify(withClubBrand(live.config_json, clubName)), userId])).rows[0];
}
async function superAdminDraft(user, clubId) {
  const tenantId = scope(clubId);
  const { rows: clubs } = await query("SELECT id, name, slug, status FROM clubs WHERE id=$1 AND status <> 'archived'", [tenantId]);
  if (!clubs[0]) throw new HttpError(404, 'We could not find an active club to design.');
  await ensureBase(tenantId);
  let draft = (await query(`SELECT * FROM site_versions WHERE club_id=$1 AND created_by=$2 AND status='draft'
    ORDER BY updated_at DESC LIMIT 1`, [tenantId, user.id])).rows[0];
  if (!draft) {
    const live = await publicConfig(tenantId);
    draft = (await query(`INSERT INTO site_versions (club_id, version_no, status, config_json, note, created_by)
      VALUES ($1, (SELECT COALESCE(MAX(version_no),0)+1 FROM site_versions WHERE club_id=$1), 'draft', $2, 'Super Admin site edit', $3)
      RETURNING *`, [tenantId, JSON.stringify(live.config), user.id])).rows[0];
  }
  const pending = (await query(`SELECT id FROM site_versions WHERE club_id=$1 AND status IN ('submitted','approved')
    AND created_by<>$2 LIMIT 1`, [tenantId, user.id])).rows.length > 0;
  return {
    ...draft,
    config_json: typeof draft.config_json === 'string' ? JSON.parse(draft.config_json) : draft.config_json,
    publish_blocked: pending,
    club: clubs[0],
  };
}
async function saveSuperAdminDraft(config, user, clubId) {
  const clean = validate(config);
  const draft = await superAdminDraft(user, clubId);
  const { rows } = await query(`UPDATE site_versions SET config_json=$3, updated_at=now()
    WHERE id=$1 AND club_id=$2 AND created_by=$4 AND status='draft' RETURNING *`,
  [draft.id, scope(clubId), JSON.stringify(clean), user.id]);
  if (!rows[0]) throw new HttpError(409, 'This draft is no longer editable. Reload and try again.');
  return rows[0];
}
async function discardSuperAdminDraft(user, clubId) {
  await query(`UPDATE site_versions SET status='archived', updated_at=now()
    WHERE club_id=$1 AND created_by=$2 AND status='draft'`, [scope(clubId), user.id]);
}
async function makeSuperAdminPreview(user, clubId) {
  const draft = await superAdminDraft(user, clubId);
  const token = randomToken(16);
  await query(`UPDATE site_versions SET preview_token=$3, preview_expires_at=now()+interval '1 hour'
    WHERE id=$1 AND club_id=$2 AND created_by=$4 AND status='draft'`,
  [draft.id, scope(clubId), token, user.id]);
  return { token, expires_in_minutes: 60, version_id: draft.id };
}
async function publishSuperAdminDraft(user, clubId) {
  const draft = await superAdminDraft(user, clubId);
  if (draft.publish_blocked) throw new HttpError(409, 'Resolve the Admin design already waiting for review or deployment first.');
  const tenantId = scope(clubId);
  const published = await tx(async db => {
    const { rows: pending } = await db.query(`SELECT id FROM site_versions WHERE club_id=$1 AND status IN ('submitted','approved')
      AND created_by<>$2 LIMIT 1`, [tenantId, user.id]);
    if (pending.length) throw new HttpError(409, 'Resolve the Admin design already waiting for review or deployment first.');
    const { rows: current } = await db.query(`SELECT id, version_no FROM site_versions
      WHERE id=$1 AND club_id=$2 AND created_by=$3 AND status='draft'`, [draft.id, tenantId, user.id]);
    if (!current[0]) throw new HttpError(409, 'This draft is no longer publishable. Reload and try again.');
    await db.query(`UPDATE site_versions SET status='archived', updated_at=now()
      WHERE club_id=$1 AND status='live'`, [tenantId]);
    const { rows } = await db.query(`UPDATE site_versions SET status='live', deployed_at=now(), updated_at=now(),
      reviewed_by=$3, review_note='Published by Super Admin'
      WHERE id=$1 AND club_id=$2 AND created_by=$3 AND status='draft' RETURNING *`,
    [draft.id, tenantId, user.id]);
    if (!rows[0]) throw new HttpError(409, 'This draft changed before it could be published.');
    await db.query(`UPDATE site_settings SET launch_status='live', updated_by=$2, updated_at=now()
      WHERE club_id=$1 AND id=1`, [tenantId, user.id]);
    return rows[0];
  });
  realtime.publish('global:features', 'site.deployed', { club_id: tenantId, version: published.version_no });
  return published;
}
async function saveDraft(config, user, clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  const clean = validate(config); const d = await currentDraft(user.id, tenantId);
  if (!['draft', 'changes_requested'].includes(d.status)) throw new HttpError(409, 'The design is waiting for review. You can edit again after the Super Admin replies.');
  const { rows } = await query(`UPDATE site_versions SET config_json=$3, status='draft', updated_at=now()
    WHERE id=$1 AND club_id=$2 AND created_by=$4 RETURNING *`, [d.id, tenantId, JSON.stringify(clean), user.id]); return rows[0];
}
function summary(a, b) {
  const out = []; if (a.template !== b.template) out.push(`Layout changed to ${b.template}`);
  if ((a.brand?.name || '') !== (b.brand?.name || '')) out.push('Club display name changed');
  if ((a.brand?.meaning || '') !== (b.brand?.meaning || '')) out.push('Club name meaning changed');
  for (const k of Object.keys(b.theme)) if (a.theme[k] !== b.theme[k]) out.push(`Theme ${k}: ${a.theme[k]} -> ${b.theme[k]}`);
  if (a.logo !== b.logo) out.push('Logo changed');
  const ids = new Set([...a.sections.map(s => s.id), ...b.sections.map(s => s.id)]);
  for (const id of ids) { const x = a.sections.find(s => s.id === id), y = b.sections.find(s => s.id === id); if (!x) out.push(`Section added: ${id}`); else if (!y) out.push(`Section removed: ${id}`); else { if (x.visible !== y.visible) out.push(`Section ${id} ${y.visible ? 'shown' : 'hidden'}`); if (JSON.stringify(x.content) !== JSON.stringify(y.content)) out.push(`Section ${id} text or images changed`); } }
  if (a.sections.map(s => s.id).join() !== b.sections.map(s => s.id).join() && a.sections.length === b.sections.length) out.push('Sections reordered');
  if (JSON.stringify(a.menu) !== JSON.stringify(b.menu)) out.push('Menu labels changed'); if (JSON.stringify(a.social) !== JSON.stringify(b.social)) out.push('Social links changed');
  if (JSON.stringify(a.banner) !== JSON.stringify(b.banner)) out.push('Announcement banner changed'); if (JSON.stringify(a.seo) !== JSON.stringify(b.seo)) out.push('SEO text changed');
  return out.length ? out : ['No visible changes'];
}
async function submit(user, note, clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  const d = await currentDraft(user.id, tenantId); if (!['draft', 'changes_requested'].includes(d.status)) throw new HttpError(409, 'This design was already sent for review.');
  await query(`UPDATE site_versions SET status='submitted', note=$3, updated_at=now() WHERE id=$1 AND club_id=$2`, [d.id, tenantId, cleanText(note, 500)]);
  await notification.notifyRoles(['super_admin'], 'Design waiting for review', `A new site design was submitted${note ? ': ' + cleanText(note, 120) : ''}.`, 'site');
  return d.id;
}
async function discardDraft(user, clubId = DEFAULT_CLUB_ID) {
  await query(`UPDATE site_versions SET status='archived', updated_at=now()
    WHERE club_id=$1 AND created_by=$2 AND status IN ('draft','changes_requested')`, [scope(clubId), user.id]);
}
async function history(clubId) {
  const tenantId = clubId ? scope(clubId) : null;
  return (await query(`SELECT v.id, v.club_id, v.version_no, v.status, v.note, v.review_note, v.deployed_at,
      v.created_at, v.updated_at, v.created_by, v.reviewed_by, c.name AS club_name
    FROM site_versions v LEFT JOIN clubs c ON c.id=v.club_id
    WHERE ($1 IS NULL OR v.club_id=$1) ORDER BY v.version_no DESC LIMIT 200`, [tenantId])).rows;
}
async function queue() {
  const { rows } = await query(`SELECT v.*, c.name AS club_name, live.config_json AS live_config
    FROM site_versions v JOIN clubs c ON c.id=v.club_id
    LEFT JOIN site_versions live ON live.club_id=v.club_id AND live.status='live'
    WHERE v.status IN ('submitted','approved') ORDER BY v.updated_at`);
  return rows.map(r => ({
    ...r,
    change_summary: summary(
      typeof r.live_config === 'string' ? JSON.parse(r.live_config) : r.live_config || DEFAULT_CONFIG,
      r.config_json,
    ),
  }));
}
async function review(id, user, action, noteText) {
  const { rows } = await query('SELECT * FROM site_versions WHERE id=$1', [id]); const v = rows[0]; if (!v) throw new HttpError(404, 'We could not find that design.');
  if (v.status !== 'submitted') throw new HttpError(409, 'This design is not waiting for review.');
  if (action !== 'approve' && (!noteText || !String(noteText).trim())) throw Object.assign(new HttpError(422, 'Please write a reason.', 'VALIDATION'), { fields: { note: 'Tell the owner why.' } });
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'changes' ? 'changes_requested' : null;
  if (!status) throw new HttpError(422, 'Choose approve, changes, or reject.');
  const { rows: updated } = await query(`UPDATE site_versions SET status=$2, reviewed_by=$3, review_note=$4, updated_at=now()
    WHERE id=$1 AND status='submitted' RETURNING id`, [id, status, user.id, cleanText(noteText, 500)]);
  if (!updated.length) throw new HttpError(409, 'This design is no longer waiting for review.');
  const msg = { approve: 'Your design was approved and is waiting for deployment.', reject: `Your design was not approved: ${cleanText(noteText, 200)}`, changes: `Changes requested: ${cleanText(noteText, 200)}` }[action];
  if (v.created_by) await notification.notify(v.created_by, 'Site design update', msg, 'site');
  return v;
}
async function deploy(id, user) {
  const { rows } = await query(`SELECT * FROM site_versions WHERE id=$1 AND status='approved'`, [id]);
  const version = rows[0];
  if (!version) throw new HttpError(409, 'Only an approved design can be deployed.');
  await tx(async db => {
    await db.query(`UPDATE site_versions SET status='archived', updated_at=now()
      WHERE club_id=$1 AND status='live'`, [version.club_id]);
    const { rows: deployed } = await db.query(`UPDATE site_versions SET status='live', deployed_at=now(), updated_at=now()
      WHERE id=$1 AND club_id=$2 AND status='approved' RETURNING id`, [id, version.club_id]);
    if (!deployed.length) throw new HttpError(409, 'This approved design is no longer available to deploy.');
    await db.query(`UPDATE site_settings SET launch_status='live', updated_at=now() WHERE club_id=$1 AND id=1`, [version.club_id]);
  });
  realtime.publish('global:features', 'site.deployed', { club_id: version.club_id, version: version.version_no });
  if (version.created_by) await notification.notify(version.created_by, 'Site design update', 'Your approved design is now live.', 'site');
  return version;
}
async function rollback(id, user) {
  const { rows } = await query('SELECT * FROM site_versions WHERE id=$1', [id]); const v = rows[0]; if (!v || !['live', 'archived'].includes(v.status)) throw new HttpError(404, 'We could not find an earlier design to restore.');
  const out = await tx(async db => { await db.query(`UPDATE site_versions SET status='archived' WHERE club_id=$1 AND status='live'`, [v.club_id]);
    return (await db.query(`INSERT INTO site_versions (club_id, version_no, status, config_json, note, created_by, reviewed_by, deployed_at)
      VALUES ($1, (SELECT COALESCE(MAX(version_no),0)+1 FROM site_versions WHERE club_id=$1), 'live', $2, $3, $4, $4, now()) RETURNING *`,
    [v.club_id, JSON.stringify(v.config_json), `Rollback to version ${v.version_no}`, user.id])).rows[0]; });
  realtime.publish('global:features', 'site.deployed', { club_id: v.club_id, version: out.version_no }); return out;
}
async function setLaunch(status, user, clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  if (!['pre_launch', 'live'].includes(status)) throw new HttpError(422, 'Choose pre_launch or live.'); await ensureBase(tenantId);
  await query('UPDATE site_settings SET launch_status=$1, updated_by=$2, updated_at=now() WHERE club_id=$3 AND id=1', [status, user.id, tenantId]); realtime.publish('global:features', 'site.deployed', { club_id: tenantId, launch: status });
}
async function makePreview(user, clubId = DEFAULT_CLUB_ID) {
  const tenantId = scope(clubId);
  const d = await currentDraft(user.id, tenantId); const token = randomToken(16);
  await query(`UPDATE site_versions SET preview_token=$3, preview_expires_at=now()+interval '1 hour'
    WHERE id=$1 AND club_id=$2`, [d.id, tenantId, token]); return { token, expires_in_minutes: 60, version_id: d.id };
}
/** Preview links need a login AND a valid, unexpired token. */
async function previewConfig(token, clubId = DEFAULT_CLUB_ID) {
  const { rows } = await query(`SELECT config_json FROM site_versions
    WHERE preview_token=$1 AND club_id=$2 AND preview_expires_at > now()`, [token, scope(clubId)]);
  if (!rows[0]) throw new HttpError(404, 'This preview link has expired.'); return rows[0].config_json;
}
const addMedia = async (file, userId, clubId = DEFAULT_CLUB_ID) => (await query(
  'INSERT INTO media_assets (club_id, path, mime, bytes, uploaded_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
  [scope(clubId), file.path, file.mime, file.bytes, userId])).rows[0];
const media = async (clubId = DEFAULT_CLUB_ID) => (await query(
  'SELECT * FROM media_assets WHERE club_id=$1 ORDER BY created_at DESC LIMIT 100', [scope(clubId)])).rows;
module.exports = {
  DEFAULT_CONFIG, TEMPLATES, FONTS, SECTION_KINDS, validate, publicConfig, currentDraft,
  superAdminDraft, saveSuperAdminDraft, discardSuperAdminDraft, makeSuperAdminPreview, publishSuperAdminDraft,
  saveDraft, submit, discardDraft, history, queue, review, deploy, rollback, setLaunch, launchStatus,
  makePreview, previewConfig, addMedia, media, summary, ensureBase,
};
