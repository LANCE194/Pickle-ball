const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { query } = require('./config/db');
const tz = require('./config/timezone');
const { auth, requireAuth } = require('./middleware/auth');
const { resolveRequestClub } = require('./shared/services/tenant');
const rate = require('./middleware/rateLimit');
const { mountAll } = require('./modules/loader');
const authlogic = require('./shared/services/authlogic');
const sessions = require('./shared/services/session');
const feature = require('./shared/services/feature');
const siteSvc = require('./shared/services/site');
const { audit } = require('./shared/services/audit');
const notification = require('./shared/services/notification');
const { wrap, HttpError } = require('./shared/utils');
const { FRIENDLY } = require('./shared/constants');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: env.clientOrigin || false, credentials: false })); // same origin by default; tokens travel in the Authorization header, not cookies
  const errorAlerts = new Map();
  app.use('/api', (req, res, next) => {
    res.once('finish', () => {
      if (res.statusCode < 400) return;
      const now = Date.now();
      const status = res.statusCode;
      const method = req.method;
      const route = typeof req.route?.path === 'string' ? req.route.path : 'unmatched or middleware';
      const key = `${status}:${method}:${route}`;
      for (const [alertKey, alert] of errorAlerts) {
        if (now - alert.sentAt >= 10 * 60 * 1000) errorAlerts.delete(alertKey);
      }
      const previous = errorAlerts.get(key);
      if (previous && now - previous.sentAt < 60 * 1000) {
        previous.suppressed += 1;
        return;
      }
      const suppressed = previous?.suppressed || 0;
      errorAlerts.set(key, { sentAt: now, suppressed: 0 });
      const repeats = suppressed ? ` ${suppressed} similar errors were grouped.` : '';
      notification.notifyRoles(['super_admin'], 'API request error', `${method} ${route} returned HTTP ${status}.${repeats}`, 'error', { inAppOnly: true })
        .catch(error => console.error('Super Admin API error alert failed:', error.message));
    });
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', rate.general);
  app.use(resolveRequestClub);
  app.use(auth);

  // ---- core: server clock, session info, logout, password change ----
  app.get('/api/time', (req, res) => res.json({ now: new Date().toISOString(), timezone: tz.TZ, date_label: tz.formatDate(new Date()), time_label: tz.formatTime(new Date()) }));
  app.get('/api/health', wrap(async (req, res) => { await query('SELECT 1'); res.json({ ok: true }); }));
  app.get('/api/auth/me', requireAuth, wrap(async (req, res) => res.json(await authlogic.meInfo(req.user))));
  app.post('/api/auth/logout', requireAuth, wrap(async (req, res) => { await sessions.revoke(req.user.sessionId); await audit(req, 'logout', 'session', req.user.sessionId); res.json({ ok: true }); })); // revokes ONLY this tab's session
  app.post('/api/auth/change-password', requireAuth, wrap(async (req, res) => { await authlogic.changePassword(req.user, req.body.currentPassword, req.body.newPassword, req); res.json({ ok: true }); }));
  app.get('/api/features', wrap(async (req, res) => res.json({ features: await feature.enabledMap(req.club && req.club.id) }))); // menus + public pages read this
  app.get('/api/site/public', wrap(async (req, res) => res.json(await siteSvc.publicConfig(req.club && req.club.id))));
  // notifications bell (core feature, every signed-in role)
  app.get('/api/notifications', requireAuth, wrap(async (req, res) => {
    const { rows } = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    const unread = rows.filter(r => !r.read_at).length; res.json({ unread, items: rows.map(r => ({ ...r, date_label: tz.formatDate(r.created_at), time_label: tz.formatTime(r.created_at) })) });
  }));
  app.post('/api/notifications/read', requireAuth, wrap(async (req, res) => { await query('UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL', [req.user.id]); res.json({ ok: true }); }));

  // ---- authenticated file serving (private storage; nothing is served from a public folder) ----
  const FILE_KINDS = { proofs: ['player', 'staff', 'admin', 'super_admin'], qr: ['player', 'staff', 'admin', 'super_admin'], profiles: ['player', 'staff', 'admin', 'super_admin', 'coach_referee'] };
  const PUBLIC_KINDS = ['courts', 'media', 'events']; // court photos, site media and event images are public content
  app.get('/api/files/:kind/:name', wrap(async (req, res) => {
    const { kind, name } = req.params;
    if (!/^[0-9a-f-]{36}\.(jpg|png)$/.test(name) || !(kind in FILE_KINDS || PUBLIC_KINDS.includes(kind))) throw new HttpError(404, 'Not found');
    if (kind in FILE_KINDS) {
      if (!req.user || !FILE_KINDS[kind].includes(req.user.role)) throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
      if (kind === 'proofs' && req.user.role === 'player') { // players only see their own proofs
        const { rows } = await query(`SELECT 1 FROM payments pay JOIN players p ON p.id=pay.player_id WHERE pay.proof_path=$1 AND p.user_id=$2`, [`proofs/${name}`, req.user.id]); if (!rows.length) throw new HttpError(404, 'Not found');
      }
      if (kind === 'profiles' && req.user.role === 'player') { const { rows } = await query(`SELECT 1 FROM players WHERE photo_path=$1 AND user_id=$2`, [`profiles/${name}`, req.user.id]); if (!rows.length) throw new HttpError(404, 'Not found'); }
    }
    if (kind === 'media') {
      const requestedClub = req.user && req.user.role === 'super_admin' && req.query.club_id
        ? req.query.club_id
        : req.club && req.club.id;
      const { rows } = await query('SELECT 1 FROM media_assets WHERE path=$1 AND club_id=$2', [`media/${name}`, requestedClub]);
      if (!rows.length) throw new HttpError(404, 'Not found');
    }
    const file = path.join(env.storageDir, kind, name); if (!fs.existsSync(file)) throw new HttpError(404, 'Not found');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', PUBLIC_KINDS.includes(kind) ? 'public, max-age=86400' : 'private, no-store'); res.sendFile(file);
  }));

  const modules = mountAll(app, { superAdminPath: env.superAdminPath });
  app.get('/api/_modules', (req, res) => (req.user && req.user.role === 'super_admin' ? res.json({ modules }) : res.status(404).end()));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));
  // ---- error handler: friendly wording, never raw errors or stack traces ----
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    const body = { error: status >= 500 ? FRIENDLY.SERVER : err.message, code: err.code || (status >= 500 ? 'SERVER' : undefined) };
    if (err.fields) body.fields = err.fields; if (err.alternatives) body.alternatives = err.alternatives; if (err.needs) body.needs = err.needs; if (err.dependents) body.dependents = err.dependents;
    res.status(status).json(body);
  });
  return app;
}
module.exports = { createApp };
