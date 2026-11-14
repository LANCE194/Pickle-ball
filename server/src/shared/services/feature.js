const { query, tx } = require('../../config/db');
const { HttpError } = require('../utils');
const realtime = require('../../realtime/gateway');
const { DEFAULT_CLUB_ID } = require('./tenant');

let cache = new Map();
const TTL = 5000;
function clubKey(clubId) { return clubId || DEFAULT_CLUB_ID; }

async function load(force = false, clubId = DEFAULT_CLUB_ID) {
  const scope = clubKey(clubId);
  const cacheKey = `features:${scope}`;
  const hit = cache.get(cacheKey);
  if (!force && hit && Date.now() - hit.at < TTL) return hit.rows;
  const { rows } = await query(`SELECT f.*, COALESCE(c.enabled, true) AS enabled FROM features f LEFT JOIN club_features c ON c.feature_key = f.key AND c.club_id = $1 ORDER BY f.area, f.label`, [scope]);
  cache.set(cacheKey, { rows, at: Date.now() });
  return rows;
}

const invalidate = () => { cache.clear(); };

async function isEnabled(key, clubId = DEFAULT_CLUB_ID) {
  if (!key) return true;
  const f = (await load(false, clubId)).find(x => x.key === key);
  if (!f) return false;
  if (f.is_core) return true;
  return f.available && f.enabled;
}

async function enabledMap(clubId = DEFAULT_CLUB_ID) {
  const out = {};
  for (const f of await load(false, clubId)) out[f.key] = f.is_core || (f.available && f.enabled);
  return out;
}

async function setEnabled(key, enabled, userId, { cascade = false, clubId = DEFAULT_CLUB_ID } = {}) {
  const scope = clubKey(clubId);
  const all = await load(true, clubId); const f = all.find(x => x.key === key);
  if (!f) throw new HttpError(404, 'Unknown feature');
  if (f.is_core) throw new HttpError(400, 'Core features are always on.');
  if (enabled && (!f.available || f.locked)) throw new HttpError(403, 'This feature has not been made available for your club yet. You can send a request.');
  const on = k => { const x = all.find(y => y.key === k); return x ? (x.is_core || (x.available && x.enabled)) : false; };
  const changes = [];
  if (enabled) {
    const need = (f.requires || []).filter(r => !on(r));
    if (need.length && !cascade) throw Object.assign(new HttpError(409, 'Other features are needed first.', 'NEEDS_CONFIRM'), { needs: need });
    for (const r of need) { const rf = all.find(x => x.key === r); if (!rf.available || rf.locked) throw new HttpError(403, `"${rf.label}" is required but is not available.`); changes.push([r, true]); }
    changes.push([key, true]);
  } else {
    const dependents = all.filter(x => !x.is_core && on(x.key) && (x.requires || []).includes(key));
    if (dependents.length && !cascade) throw Object.assign(new HttpError(409, 'Other features depend on this one.', 'NEEDS_CONFIRM'), { dependents: dependents.map(d => d.key) });
    for (const d of dependents) changes.push([d.key, false]);
    changes.push([key, false]);
    const after = k => { const c = changes.find(x => x[0] === k); return c ? c[1] : on(k); };
    if (!after('qr_payments') && !after('pay_at_court')) throw new HttpError(400, 'At least one payment method must stay on (QR payments or Pay at the court).');
  }
  await tx(async db => {
    for (const [k, v] of changes) await db.query(`INSERT INTO club_features (club_id, feature_key, enabled, changed_by) VALUES ($1,$2,$3,$4)
      ON CONFLICT (club_id, feature_key) DO UPDATE SET enabled=$3, changed_by=$4, changed_at=now()`, [scope, k, v, userId]);
  });
  invalidate();
  realtime.publish('global:features', 'features.changed', { keys: changes.map(c => c[0]) });
  return changes.map(c => c[0]);
}

async function setAvailability(key, { available, locked } = {}) {
  const f = (await load(true)).find(x => x.key === key); if (!f) throw new HttpError(404, 'Unknown feature');
  if (f.is_core) throw new HttpError(400, 'Core features are always on.');
  await query('UPDATE features SET available=COALESCE($2, available), locked=COALESCE($3, locked) WHERE key=$1', [key, available ?? null, locked ?? null]);
  invalidate(); realtime.publish('global:features', 'features.changed', { keys: [key] });
}

module.exports = { load, isEnabled, enabledMap, setEnabled, setAvailability, invalidate };
