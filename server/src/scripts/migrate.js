// Creates / updates the SQLite database. Safe to run on every start.
const fs = require('fs'); const path = require('path');
const { exec, db, expand } = require('../config/db');
const dir = path.join(__dirname, '../../../database');
function applied(database, name) {
  return !!database.prepare('SELECT 1 FROM _migrations WHERE name=?').get(name);
}
function markApplied(database, name) {
  database.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
}
function runMigration(database, file) {
  const migrationPath = path.join(dir, 'migrations', file);
  if (file.endsWith('.js')) require(migrationPath).up(database);
  else database.exec(expand(fs.readFileSync(migrationPath, 'utf8')));
  markApplied(database, file);
}
function migrate(database = db) {
  database.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT)');
  const mig = path.join(dir, 'migrations');
  const files = fs.existsSync(mig) ? fs.readdirSync(mig).filter(x => /^\d+_.+\.(?:js|sql)$/.test(x)).sort() : [];
  for (const file of files) {
    if (file.endsWith('.js') && require(path.join(mig, file)).beforeSchema && !applied(database, file)) {
      runMigration(database, file);
      console.log('applied migration', file);
    }
  }
  const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
  if (database === db) exec(schema);
  else database.exec(expand(schema));
  for (const file of files) {
    if (applied(database, file)) continue;
    runMigration(database, file);
    console.log('applied migration', file);
  }
  const seeds = fs.readFileSync(path.join(dir, 'seeds/001_base.sql'), 'utf8');
  if (database === db) exec(seeds);
  else database.exec(expand(seeds));
}
module.exports = { migrate };
if (require.main === module) { migrate(); console.log('Database ready (schema + base data).'); }
