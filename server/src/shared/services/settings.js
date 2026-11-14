const { query } = require('../../config/db');
const { DEFAULT_SETTINGS } = require('../constants');
const { DEFAULT_CLUB_ID } = require('./tenant');

async function getAll(clubId = DEFAULT_CLUB_ID) {
  const { rows } = await query('SELECT key, value FROM settings WHERE club_id=$1 OR club_id IS NULL', [clubId]);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}
const get = async (key, clubId = DEFAULT_CLUB_ID) => (await getAll(clubId))[key];
async function set(key, value, userId, clubId = DEFAULT_CLUB_ID) {
  await query(`INSERT INTO settings (club_id, key, value, updated_by) VALUES ($1,$2,$3,$4)
    ON CONFLICT (club_id, key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`, [clubId, key, JSON.stringify(value), userId]);
}
module.exports = { getAll, get, set };
