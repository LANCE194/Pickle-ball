require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
require('dotenv').config();
const path = require('path');
const root = path.join(__dirname, '../../..');
const e = process.env;
module.exports = {
  root,
  isProd: e.NODE_ENV === 'production',
  dev: process.argv.includes('--dev') || e.DEV === 'true',
  port: Number(e.PORT || 4000),
  databaseFile: e.DATABASE_FILE === ':memory:' ? ':memory:' : path.resolve(root, e.DATABASE_FILE || 'data/dinknest.db'), // SQLite file, created automatically. Use :memory: for tests.
  defaultClubHosts: (e.DEFAULT_CLUB_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean),
  multiClubEnabled: e.MULTICLUB_ENABLED === 'true',
  clubSubdomainBaseDomain: e.CLUB_SUBDOMAIN_BASE_DOMAIN || '',
  clubSubdomainWildcardReady: e.CLUB_SUBDOMAIN_WILDCARD_READY === 'true',
  clientOrigin: e.CLIENT_ORIGIN || '',
  storageDir: path.resolve(root, e.STORAGE_DIR || 'data/storage'),
  superAdminPath: e.SUPER_ADMIN_PATH || '',
  superAdminEmail: e.SUPER_ADMIN_EMAIL || '',
  superAdminInitialPassword: e.SUPER_ADMIN_INITIAL_PASSWORD || '',
  superAdminSecondFactor: e.SUPER_ADMIN_SECOND_FACTOR === 'none' ? 'none' : 'totp',
  superAdminIpAllowlist: (e.SUPER_ADMIN_IP_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean),
  totpIssuer: e.TOTP_ISSUER || 'DinkNest',
  seedDemo: e.SEED_DEMO_DATA === 'true',
  skipBuild: e.SKIP_BUILD === 'true',
  smtp: { host: e.SMTP_HOST, port: Number(e.SMTP_PORT || 587), user: e.SMTP_USER, pass: e.SMTP_PASS, from: e.MAIL_FROM || 'DinkNest <no-reply@dinknest.local>' },
  sms: {
    provider: e.SMS_PROVIDER || '',
    accountSid: e.TWILIO_ACCOUNT_SID || '',
    authToken: e.TWILIO_AUTH_TOKEN || '',
    fromNumber: e.TWILIO_FROM_NUMBER || '',
    messagingServiceSid: e.TWILIO_MESSAGING_SERVICE_SID || '',
  },
};
