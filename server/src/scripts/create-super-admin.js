// One-time bootstrap: creates the pre-generated Super Admin. There is no screen or API route that can do this.
// Reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_PASSWORD from the environment. With no password a random one is generated and
// printed ONCE here. It is stored only as a hash, never in code, seeds, README or logs.
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { query } = require('../config/db');
const { tempPassword } = require('../shared/utils');
async function ensureSuperAdmin({ quiet = false } = {}) {
  if (!env.superAdminEmail) return { created: false, reason: 'no SUPER_ADMIN_EMAIL' };
  const exists = await query(`SELECT 1 FROM users WHERE role='super_admin'`);
  if (exists.rows.length) return { created: false, reason: 'exists' };
  const generated = !env.superAdminInitialPassword; const pw = env.superAdminInitialPassword || tempPassword(16);
  await query(`INSERT INTO users (role, email, password_hash, status, must_change_password) VALUES ('super_admin',$1,$2,'active',true)`, [env.superAdminEmail.toLowerCase(), await bcrypt.hash(pw, 12)]);
  await query(`INSERT INTO audit_logs (action, entity, role, details) VALUES ('bootstrap.super_admin_created','user','super_admin',$1)`, [JSON.stringify({ generated_password: generated })]);
  if (!quiet) { console.log('Super Admin created for', env.superAdminEmail); console.log(env.superAdminSecondFactor === 'none' ? 'At first login you must change the password.' : 'At first login you must change the password and set up the authenticator app (second factor).'); if (generated) console.log('One-time password (copy it now, it is not stored):', pw); }
  return { created: true };
}
module.exports = { ensureSuperAdmin };
if (require.main === module) { require('./migrate').migrate(); ensureSuperAdmin().then(r => { if (!r.created) console.log(r.reason === 'exists' ? 'A Super Admin already exists. Nothing changed.' : 'Set SUPER_ADMIN_EMAIL first (in .env).'); }).catch(e => { console.error(e.message); process.exit(1); }); }
