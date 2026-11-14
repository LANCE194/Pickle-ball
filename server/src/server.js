// ONE process runs everything: the database (a single SQLite file), the API, live updates, and the web app.
//   npm start       production: builds the web app once if needed, then serves it on the same port as the API
//   npm run dev     development: same server, with the web app reloading as you edit
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const env = require('./config/env');
const { migrate } = require('./scripts/migrate');
const { createApp } = require('./app');
const realtime = require('./realtime/gateway');
const booking = require('./shared/services/booking');
const membership = require('./shared/services/membership');
const feature = require('./shared/services/feature');
const siteSvc = require('./shared/services/site');
const { ensureSuperAdmin } = require('./scripts/create-super-admin');
const { seedDemo } = require('./scripts/seed');
const clientDir = path.join(env.root, 'client');
const dist = path.join(clientDir, 'dist');
const reportJobError = name => error => console.error(`Scheduled job ${name} failed:`, error.message);

async function serveClient(app) {
  let vite; try { vite = await import('vite'); } catch { vite = null; }
  if (env.dev) {
    if (!vite) throw new Error('Run "npm install" first (the web app tools are missing).');
    const dev = await vite.createServer({ root: clientDir, configFile: path.join(clientDir, 'vite.config.js'), server: { middlewareMode: true }, appType: 'spa', logLevel: 'warn' });
    app.use(dev.middlewares); console.log('Web app: development mode (reloads as you edit)'); return;
  }
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    if (!vite || env.skipBuild) { console.warn('The web app is not built. Run "npm install" then "npm run build", then start again.'); return; }
    console.log('Building the web app (first start only)...'); await vite.build({ root: clientDir, configFile: path.join(clientDir, 'vite.config.js'), logLevel: 'warn' });
  }
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => (req.path.startsWith('/api') || req.path.startsWith('/ws') ? next() : res.sendFile(path.join(dist, 'index.html'))));
}

async function main() {
  migrate();                                   // creates data/dinknest.db on first run, keeps it up to date after
  await siteSvc.ensureBase();
  if (env.seedDemo) { await seedDemo(); console.log('Demo accounts ready (password Demo1234).'); }
  const sa = await ensureSuperAdmin();         // only when SUPER_ADMIN_EMAIL is set and no Super Admin exists yet
  const app = createApp(); const server = http.createServer(app);
  realtime.attach(server);
  await serveClient(app);
  server.listen(env.port, () => {
    console.log(`DinkNest is running: http://localhost:${env.port}`);
    if (!env.superAdminEmail && !sa.created) console.log('Tip: set SUPER_ADMIN_EMAIL in .env and restart to create the Super Admin (the password is printed once).');
    if (!env.superAdminPath) console.warn('SUPER_ADMIN_PATH is empty: the Super Admin entrance is disabled.');
  });
  // Background jobs run on the server clock. Switching a feature off stops its jobs (checked inside each job).
  setInterval(() => booking.expirePending().catch(reportJobError('booking expiry')), 60 * 1000);
  setInterval(() => booking.sendReminders().catch(reportJobError('booking reminders')), 5 * 60 * 1000);
  setInterval(async () => {
    const enabled = await feature.isEnabled('memberships').catch(error => {
      reportJobError('membership feature check')(error);
      return false;
    });
    if (enabled) membership.sendReminders().catch(reportJobError('membership reminders'));
  }, 60 * 60 * 1000);
}
main().catch(e => { console.error(e); process.exit(1); });
