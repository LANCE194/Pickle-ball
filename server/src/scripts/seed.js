// Demo accounts exist ONLY when SEED_DEMO_DATA=true (development). In production the only account is the Super Admin.
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { query } = require('../config/db');
const { DEFAULT_CLUB_ID } = require('../shared/services/tenant');
async function seedDemo() {
  if (env.isProd) { console.error('Refusing to create demo accounts in production.'); return false; }
  const pw = await bcrypt.hash('Demo1234', 10);
  const mk = async (role, email, mobile, status, table, f) => {
    const u = await query(`INSERT INTO users (club_id,role,email,mobile,password_hash,status) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`, [DEFAULT_CLUB_ID, role, email, mobile, status === 'invited' ? null : pw, status]);
    if (!u.rows[0]) return; const cols = Object.keys(f), vals = Object.values(f);
    await query(`INSERT INTO ${table} (user_id, ${cols.join(',')}) VALUES ($1${cols.map((_, i) => `,$${i + 2}`).join('')})`, [u.rows[0].id, ...vals]);
  };
  await mk('admin', 'admin@dinknest.test', '09170000001', 'active', 'staff_profiles', { first_name: 'Olivia', last_name: 'Owner', club_name: 'DinkNest Club', position_title: 'Owner' });
  await mk('staff', 'staff@dinknest.test', '09170000002', 'active', 'staff_profiles', { first_name: 'Sam', last_name: 'Desk', position_title: 'Front desk', employee_id: 'E-001' });
  await mk('coach_referee', 'coach@dinknest.test', '09170000003', 'active', 'referee_profiles', { first_name: 'Rey', last_name: 'Referee', role_type: 'both', certification_name: 'PH Pickleball Referee', certification_no: 'R-1001', certifying_body: 'PPF' });
  await mk('player', 'player1@dinknest.test', '09171000001', 'active', 'players', { first_name: 'Paolo', last_name: 'Reyes', birthdate: '1995-04-12', rating: 3.2, skill_level: 'intermediate', status: 'active', waiver_accepted: true });
  await mk('player', 'player2@dinknest.test', '09171000002', 'active', 'players', { first_name: 'Ana', last_name: 'Cruz', birthdate: '1990-09-30', rating: 3.0, skill_level: 'intermediate', status: 'active', waiver_accepted: true });
  await mk('player', 'invited@dinknest.test', '09171000003', 'invited', 'players', { first_name: 'Ivan', last_name: 'Invited', status: 'pending_verification' }); // test activation by OTP
  await query(`INSERT INTO membership_plans (name, price, duration_days, discount_percent, priority_booking, perks) SELECT 'Monthly Member', 1500, 30, 10, true, '10% off court time' WHERE NOT EXISTS (SELECT 1 FROM membership_plans)`);
  return true;
}
module.exports = { seedDemo };
if (require.main === module) { require('./migrate').migrate(); if (!env.seedDemo) console.log('SEED_DEMO_DATA is not true. No demo accounts created.'); else seedDemo().then(() => console.log('Demo accounts ready (password for all: Demo1234; invited player has no password, use Activate account).')); }
