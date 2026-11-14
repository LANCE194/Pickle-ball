// SQLite data layer (better-sqlite3). Keeps the same async query(text, params) / tx(fn) API the services were written with.
// Services write Postgres-style SQL ($1 params, ANY($1), ::casts, now(), interval '..'). translate() turns that into plain SQLite,
// so there is nothing to install and no database server to run: the whole database is one file.
const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');
const env = require('./env');

let driver = 'better-sqlite3', Database;
try { Database = require('better-sqlite3'); } catch { driver = 'node:sqlite'; ({ DatabaseSync: Database } = require('node:sqlite')); } // built-in fallback (Node 22+) when the package is not installed
if (env.databaseFile !== ':memory:') fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });
const db = new Database(env.databaseFile);
for (const p of ['journal_mode = WAL', 'foreign_keys = ON', 'busy_timeout = 5000', 'synchronous = NORMAL']) db.exec(`PRAGMA ${p}`);

const ISO_NOW = `strftime('%Y-%m-%dT%H:%M:%fZ','now')`;
const UUID = `lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',abs(random())%4+1,1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6)))`;
/** Postgres-ish SQL text -> SQLite SQL text (no parameters involved). */
function expand(sql) {
  return sql
    .replace(/\(\s*((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*(?:\(\))?)\s+AT\s+TIME\s+ZONE\s+'Asia\/Manila'\s*\)(?:\s*::\s*date)?/gi, (m, x) => `date(${x},'+8 hours')`)
    .replace(/\bcurrent_date\b/gi, `date(now(),'+8 hours')`)
    .replace(/date\(((?:[^()]|\(\))*?),'\+8 hours'\)\s*\+\s*(\$\d+)(?:\s*::\s*int)?/gi, (m, x, p) => `date(${x},'+8 hours','+' || ${p} || ' days')`)
    .replace(/\bnow\(\)\s*([+-])\s*interval\s*'(\d+)\s*(minute|hour|day)s?'/gi, (m, s, n, u) => `strftime('%Y-%m-%dT%H:%M:%fZ','now','${s}${n} ${u}s')`)
    .replace(/\s+FOR\s+(?:UPDATE|SHARE)(?:\s+OF\s+\w+)?/gi, '')
    .replace(/\bGREATEST\(/gi, 'max(').replace(/\bLEAST\(/gi, 'min(').replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/::\s*(?:text|int|integer|date|numeric|uuid|boolean|float|bigint|jsonb|timestamptz)(?:\[\])?/gi, '')
    .replace(/\bnow\(\)/gi, ISO_NOW).replace(/\bgen_random_uuid\(\)/gi, UUID);
}
const conv = v => (v instanceof Date ? v.toISOString() : typeof v === 'boolean' ? (v ? 1 : 0) : v === undefined ? null : Array.isArray(v) || (v && typeof v === 'object' && !Buffer.isBuffer(v)) ? JSON.stringify(v) : v);
/** Numbered $n params -> positional ?, and "= ANY($n)" with an array -> IN (?,?,?). */
function translate(sql, params = []) {
  const args = [];
  const out = expand(sql).replace(/=\s*ANY\(\s*\$(\d+)\s*\)|\$(\d+)/g, (m, any, plain) => {
    if (any) { const arr = params[any - 1]; if (!Array.isArray(arr) || !arr.length) return 'IN (NULL)'; arr.forEach(x => args.push(conv(x))); return `IN (${arr.map(() => '?').join(',')})`; }
    args.push(conv(params[plain - 1])); return '?';
  });
  return { sql: out, args };
}
const BOOL = new Set(['is_core', 'available', 'locked', 'enabled', 'must_change_password', 'totp_enrolled', 'level_verified', 'waiver_accepted', 'privacy_consent', 'guardian_consent', 'weekend_all_day_peak', 'is_walk_in', 'pinned', 'handled', 'consent', 'priority_booking', 'active', 'is_bye', 'needs_host_approval', 'has_proof', 'in_my_level']);
const JSONC = new Set(['permissions', 'details', 'config_json', 'value', 'tokens', 'default_content', 'games', 'requires']);
const TS = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
/** Give rows the same shapes Postgres gave: booleans, parsed JSON, and Date objects for timestamps. */
function mapRow(r) {
  const o = {};
  for (const k of Object.keys(r)) {
    let v = r[k];
    if (v === null || v === undefined) { o[k] = null; continue; }
    if (BOOL.has(k)) v = !!v;
    else if (JSONC.has(k) && typeof v === 'string') { try { v = JSON.parse(v); } catch { /* keep text */ } }
    else if (typeof v === 'string' && (k.endsWith('_at') || k === 'registration_deadline' || k === 'locked_until') && TS.test(v)) v = new Date(v);
    o[k] = v;
  }
  return o;
}
function fail(e) { // keep the Postgres error codes the services check for
  if (/SLOT_TAKEN/.test(e.message)) e.code = '23P01';
  else if (/UNIQUE constraint failed|PRIMARY KEY/i.test(e.message)) e.code = '23505';
  else if (/FOREIGN KEY/i.test(e.message)) e.code = '23503';
  return e;
}
const READS = /^\s*(select|with|pragma|values)\b|\breturning\b/i; const cache = new Map();
function run(text, params) {
  const { sql, args } = translate(text, params);
  try {
    let st = cache.get(sql); if (!st) { st = db.prepare(sql); if (cache.size > 500) cache.clear(); cache.set(sql, st); }
    if (READS.test(sql)) return { rows: st.all(...args).map(mapRow) };
    const r = st.run(...args); return { rows: [], rowCount: r.changes };
  } catch (e) { throw fail(e); }
}
// One connection, so transactions are serialised: other requests wait while one is open (code inside the transaction keeps using it).
const als = new AsyncLocalStorage(); let active = null;
const idle = async () => { while (active) await active.catch(() => {}); };
async function query(text, params) { if (!als.getStore()) await idle(); return run(text, params); }
async function tx(fn) {
  const client = { query: async (t, p) => run(t, p), release() {} };
  if (als.getStore()) return fn(client); // nested: join the open transaction
  while (active) await active.catch(() => {});
  let release; active = new Promise(r => { release = r; });
  try {
    db.exec('BEGIN IMMEDIATE');
    const out = await als.run(true, () => fn(client));
    db.exec('COMMIT'); return out;
  } catch (e) { try { db.exec('ROLLBACK'); } catch { /* already closed */ } throw e; }
  finally { active = null; release(); }
}
async function withExclusiveConnection(fn) {
  if (als.getStore()) throw new Error('An exclusive connection cannot be opened inside a transaction.');
  while (active) await active.catch(() => {});
  let release; active = new Promise(r => { release = r; });
  try { return await fn(db); }
  finally { active = null; release(); }
}
/** Run a script with several statements (schema, seeds). */
const exec = sql => db.exec(expand(sql));
const pool = { query, end: async () => db.close() };
module.exports = { query, tx, withExclusiveConnection, exec, pool, db, driver, translate, expand, uuid: randomUUID };
