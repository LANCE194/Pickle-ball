const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const env = require('../../config/env');
const { db, withExclusiveConnection } = require('../../config/db');
const { audit } = require('./audit');
const { HttpError } = require('../utils');

const FORMAT = 'dinknest-backup';
const VERSION = 1;
const MAX_COMPRESSED_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 1024 * 1024 * 1024;
const EXCLUDED_CLUB_TABLES = new Set(['sessions', 'otp_codes', 'audit_logs']);
const quote = value => `"${String(value).replace(/"/g, '""')}"`;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function requireRole(req, role) {
  if (!req.user || req.user.role !== role) throw new HttpError(403, 'You do not have permission to use this backup operation.', 'FORBIDDEN');
}
const backupDir = () => {
  const dir = path.join(env.storageDir, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function archiveName(kind) {
  const id = crypto.randomUUID();
  return kind === 'full'
    ? `dinknest-full-${stamp()}-${id}.dnbackup.gz`
    : `dinknest-club-${stamp()}-${id}.dnclub.gz`;
}

function writeArchive(name, buffer) {
  const target = path.join(backupDir(), name);
  const temporary = `${target}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, buffer, { flag: 'wx' });
  fs.renameSync(temporary, target);
  return target;
}

function makeArchive(payload) {
  return zlib.gzipSync(Buffer.from(JSON.stringify(payload)), { level: 6 });
}

function decodeArchive(buffer, kind) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_COMPRESSED_BYTES) {
    throw new HttpError(413, 'The backup file is empty or too large.', 'INVALID_BACKUP');
  }
  let payload;
  try {
    payload = JSON.parse(zlib.gunzipSync(buffer, { maxOutputLength: MAX_EXPANDED_BYTES }).toString('utf8'));
  } catch {
    throw new HttpError(422, 'This backup file is damaged or is not a DinkNest backup.', 'INVALID_BACKUP');
  }
  if (!payload || payload.format !== FORMAT || payload.version !== VERSION || payload.kind !== kind ||
      typeof payload.packageId !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.packageId)) {
    throw new HttpError(422, 'This backup is not a supported DinkNest backup.', 'INVALID_BACKUP');
  }
  return payload;
}

function safeStoragePath(relative) {
  if (typeof relative !== 'string' || relative.length > 240 || relative.includes('\\') ||
      relative.startsWith('/') || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new HttpError(422, 'The backup contains an invalid storage path.', 'INVALID_BACKUP');
  }
  if (!/^(?:(?:proofs|qr|profiles|courts|events|media)\/[0-9a-f-]{36}\.(?:jpg|png)|chat-backups\/[0-9a-f-]{36}\.dnclub\.gz)$/i.test(relative)) {
    throw new HttpError(422, 'The backup contains an unsupported storage file.', 'INVALID_BACKUP');
  }
  const full = path.resolve(env.storageDir, ...relative.split('/'));
  const root = path.resolve(env.storageDir) + path.sep;
  if (!full.startsWith(root)) throw new HttpError(422, 'The backup contains an invalid storage path.', 'INVALID_BACKUP');
  return full;
}

function validateFiles(files) {
  if (!Array.isArray(files) || files.length > 20000) throw new HttpError(422, 'The backup file list is invalid.', 'INVALID_BACKUP');
  const seen = new Set();
  let total = 0;
  for (const file of files) {
    const fullPath = safeStoragePath(file && file.path);
    if (seen.has(file.path) || typeof file.content !== 'string' || !/^[0-9a-f]{64}$/.test(file.sha256 || '')) {
      throw new HttpError(422, 'The backup contains an invalid or repeated file.', 'INVALID_BACKUP');
    }
    const content = Buffer.from(file.content, 'base64');
    if (!content.length || content.toString('base64') !== file.content || hash(content) !== file.sha256) {
      throw new HttpError(422, 'A backup file failed its integrity check.', 'INVALID_BACKUP');
    }
    seen.add(file.path);
    total += content.length;
    if (total > MAX_EXPANDED_BYTES) throw new HttpError(413, 'The backup contains too much file data.', 'INVALID_BACKUP');
    file._buffer = content;
    file._fullPath = fullPath;
  }
  return files;
}

function tableNames(database) {
  return database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all().map(row => row.name);
}

function tableColumns(database, table) {
  return database.prepare(`PRAGMA table_info(${quote(table)})`).all();
}

function hasColumn(database, table, column) {
  return tableColumns(database, table).some(item => item.name === column);
}

function storageFiles(relativeRoot = '') {
  const root = path.resolve(env.storageDir);
  const output = [];
  function walk(dir, relative) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!relative && entry.name === 'backups') continue;
      if (entry.name.startsWith('.restore-')) continue;
      const currentRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute, currentRelative);
      else if (entry.isFile()) output.push({ path: currentRelative, absolute });
    }
  }
  walk(path.join(root, relativeRoot), relativeRoot);
  return output;
}

function encodeFiles(paths) {
  return paths.map(({ path: relative, absolute }) => {
    const content = fs.readFileSync(absolute);
    return { path: relative, sha256: hash(content), content: content.toString('base64') };
  });
}

function installFiles(files) {
  fs.mkdirSync(env.storageDir, { recursive: true });
  const stage = fs.mkdtempSync(path.join(env.storageDir, '.restore-'));
  const originals = new Map();
  const installed = [];
  try {
    for (const file of files) {
      const stagedPath = path.join(stage, 'new', ...file.path.split('/'));
      fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
      fs.writeFileSync(stagedPath, file._buffer, { flag: 'wx' });
      const destination = file._fullPath;
      if (fs.existsSync(destination)) {
        const oldPath = path.join(stage, 'old', ...file.path.split('/'));
        fs.mkdirSync(path.dirname(oldPath), { recursive: true });
        fs.copyFileSync(destination, oldPath);
        originals.set(destination, oldPath);
      } else {
        originals.set(destination, null);
      }
    }
    for (const file of files) {
      const destination = file._fullPath;
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(stage, 'new', ...file.path.split('/')), destination);
      installed.push(destination);
    }
  } catch (error) {
    for (const destination of installed.reverse()) {
      const original = originals.get(destination);
      if (original) fs.copyFileSync(original, destination);
      else if (fs.existsSync(destination)) fs.unlinkSync(destination);
    }
    fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }
  return {
    rollback() {
      for (const destination of installed.reverse()) {
        const original = originals.get(destination);
        if (original) fs.copyFileSync(original, destination);
        else if (fs.existsSync(destination)) fs.unlinkSync(destination);
      }
      fs.rmSync(stage, { recursive: true, force: true });
    },
    commit() { fs.rmSync(stage, { recursive: true, force: true }); },
  };
}

function clubTables(database) {
  return tableNames(database)
    .filter(table => !EXCLUDED_CLUB_TABLES.has(table) && hasColumn(database, table, 'club_id'))
    .sort();
}

async function makeClubArchive(req) {
  requireRole(req, 'admin');
  const clubId = req.user && req.user.clubId;
  if (!clubId) throw new HttpError(403, 'An Admin club is required to export this backup.', 'CLUB_REQUIRED');
  return withExclusiveConnection(async database => {
    const club = database.prepare('SELECT id, name FROM clubs WHERE id=?').get(clubId);
    if (!club) throw new HttpError(404, 'The Admin club could not be found.', 'CLUB_NOT_FOUND');
    const tables = {};
    for (const table of clubTables(database)) {
      tables[table] = database.prepare(`SELECT * FROM ${quote(table)} WHERE club_id=?`).all(clubId);
    }
    const filePaths = new Set();
    for (const rows of Object.values(tables)) {
      for (const row of rows) {
        for (const value of Object.values(row)) {
          if (typeof value === 'string' && /^(?:proofs|qr|profiles|courts|events|media)\/[0-9a-f-]{36}\.(?:jpg|png)$/i.test(value)) {
            const fullPath = safeStoragePath(value);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) filePaths.add(value);
          }
        }
      }
    }
    const files = encodeFiles([...filePaths].map(relative => ({ path: relative, absolute: safeStoragePath(relative) })));
    const payload = {
      format: FORMAT, version: VERSION, kind: 'club', packageId: crypto.randomUUID(),
      createdAt: new Date().toISOString(), club: { id: club.id, name: club.name }, tables, files,
    };
    const buffer = makeArchive(payload);
    if (buffer.length > MAX_COMPRESSED_BYTES) throw new HttpError(413, 'The club backup is too large to export.', 'BACKUP_TOO_LARGE');
    return { name: archiveName('club'), buffer, clubId, clubName: club.name, files: files.length };
  });
}

async function createClub(req) {
  const archive = await makeClubArchive(req);
  writeArchive(archive.name, archive.buffer);
  await audit(req, 'backup.club_export', 'backup', archive.name, { club_id: archive.clubId });
  return { name: archive.name, bytes: archive.buffer.length, clubId: archive.clubId, clubName: archive.clubName };
}

async function createFull(req) {
  requireRole(req, 'super_admin');
  if (env.databaseFile === ':memory:') throw new HttpError(409, 'A memory database cannot be backed up.');
  const result = await withExclusiveConnection(async database => {
    const temporaryDb = path.join(backupDir(), `.snapshot-${crypto.randomUUID()}.db`);
    try {
      database.exec(`VACUUM INTO '${temporaryDb.replace(/'/g, "''")}'`);
      const databaseBytes = fs.readFileSync(temporaryDb);
      const payload = {
        format: FORMAT, version: VERSION, kind: 'full', packageId: crypto.randomUUID(),
        createdAt: new Date().toISOString(), database: databaseBytes.toString('base64'),
        databaseSha256: hash(databaseBytes), files: encodeFiles(storageFiles()),
      };
      const buffer = makeArchive(payload);
      if (buffer.length > MAX_COMPRESSED_BYTES) throw new HttpError(413, 'The full backup is too large to create.', 'BACKUP_TOO_LARGE');
      const name = archiveName('full');
      writeArchive(name, buffer);
      return { name, bytes: buffer.length };
    } finally {
      if (fs.existsSync(temporaryDb)) fs.unlinkSync(temporaryDb);
    }
  });
  await audit(req, 'backup.full_export', 'backup', result.name);
  return result;
}

function archivePath(name) {
  if (typeof name !== 'string' || !/^dinknest-(?:full-[\w-]+\.dnbackup\.gz|club-[\w-]+\.dnclub\.gz|[\w-]+\.db)$/.test(name)) {
    throw new HttpError(404, 'Backup not found.');
  }
  const file = path.join(backupDir(), name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new HttpError(404, 'Backup not found.');
  return file;
}

function listFull() {
  return fs.readdirSync(backupDir())
    .filter(name => /^dinknest-full-[\w-]+\.dnbackup\.gz$/.test(name) || /^dinknest-[\w-]+\.db$/.test(name))
    .map(name => {
      const stat = fs.statSync(path.join(backupDir(), name));
      return { name, bytes: stat.size, created_at: stat.mtime };
    })
    .sort((a, b) => b.created_at - a.created_at);
}

function validateClubPayload(payload) {
  if (!payload.club || typeof payload.club.id !== 'string' || !payload.tables || typeof payload.tables !== 'object' || Array.isArray(payload.tables)) {
    throw new HttpError(422, 'This club backup is missing required data.', 'INVALID_BACKUP');
  }
  validateFiles(payload.files);
}

async function importClub(req, buffer) {
  requireRole(req, 'super_admin');
  const payload = decodeArchive(buffer, 'club');
  validateClubPayload(payload);
  const importedFiles = payload.files;
  let installed;
  let result;
  try {
    result = await withExclusiveConnection(async database => {
      const club = database.prepare('SELECT id FROM clubs WHERE id=?').get(payload.club.id);
      if (!club) throw new HttpError(404, 'This backup belongs to a club that does not exist in this system.', 'CLUB_NOT_FOUND');
      if (database.prepare('SELECT 1 FROM backup_imports WHERE package_id=?').get(payload.packageId)) {
        throw new HttpError(409, 'This club backup has already been imported.', 'BACKUP_ALREADY_IMPORTED');
      }
      const allowedTables = new Set(clubTables(database));
      const tables = Object.keys(payload.tables);
      if (!tables.length || tables.some(table => !allowedTables.has(table))) {
        throw new HttpError(422, 'The backup contains tables that are not supported for club restore.', 'INVALID_BACKUP');
      }
      for (const table of tables) {
        const columns = tableColumns(database, table);
        const names = columns.map(column => column.name);
        const primary = columns.filter(column => column.pk).sort((a, b) => a.pk - b.pk).map(column => column.name);
        if (!primary.length || !Array.isArray(payload.tables[table])) throw new HttpError(422, 'The backup table data is invalid.', 'INVALID_BACKUP');
        const findExisting = `SELECT club_id FROM ${quote(table)} WHERE ${primary.map(name => `${quote(name)}=?`).join(' AND ')}`;
        for (const row of payload.tables[table]) {
          if (!row || typeof row !== 'object' || Array.isArray(row) ||
              Object.keys(row).length !== names.length || names.some(name => !Object.prototype.hasOwnProperty.call(row, name)) ||
              row.club_id !== payload.club.id || (table === 'users' && row.role === 'super_admin')) {
            throw new HttpError(422, 'The backup contains invalid or cross-club records.', 'INVALID_BACKUP');
          }
          const existing = database.prepare(findExisting).get(...primary.map(name => row[name]));
          if (existing && existing.club_id !== payload.club.id) {
            throw new HttpError(409, 'A record in this backup conflicts with another club.', 'BACKUP_CONFLICT');
          }
        }
      }
      installed = installFiles(importedFiles);
      try {
        database.exec('BEGIN IMMEDIATE');
        database.exec('PRAGMA defer_foreign_keys=ON');
        let records = 0;
        for (const table of tables) {
          const columns = tableColumns(database, table);
          const names = columns.map(column => column.name);
          const primary = columns.filter(column => column.pk).sort((a, b) => a.pk - b.pk).map(column => column.name);
          const fields = names.map(quote).join(', ');
          const values = names.map(() => '?').join(', ');
          const nonPrimary = names.filter(name => !primary.includes(name));
          const findExisting = `SELECT club_id FROM ${quote(table)} WHERE ${primary.map(name => `${quote(name)}=?`).join(' AND ')}`;
          const update = nonPrimary.length
            ? database.prepare(`UPDATE ${quote(table)} SET ${nonPrimary.map(name => `${quote(name)}=?`).join(', ')} WHERE ${primary.map(name => `${quote(name)}=?`).join(' AND ')}`)
            : null;
          const insert = database.prepare(`INSERT INTO ${quote(table)} (${fields}) VALUES (${values})`);
          const find = database.prepare(findExisting);
          for (const row of payload.tables[table]) {
            if (find.get(...primary.map(name => row[name]))) {
              if (update) update.run(...nonPrimary.map(name => row[name] === undefined ? null : row[name]), ...primary.map(name => row[name]));
            } else {
              insert.run(...names.map(name => row[name] === undefined ? null : row[name]));
            }
            records += 1;
          }
        }
        const violations = database.prepare('PRAGMA foreign_key_check').all();
        if (violations.length) throw new HttpError(422, 'The club backup has unresolved record references.', 'BACKUP_FOREIGN_KEY');
        database.prepare('INSERT INTO backup_imports (package_id, club_id, imported_by) VALUES (?, ?, ?)')
          .run(payload.packageId, payload.club.id, req.user.id);
        database.exec('COMMIT');
        return { clubId: payload.club.id, clubName: payload.club.name, records, files: importedFiles.length };
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* the transaction may already have rolled back */ }
        installed.rollback();
        installed = null;
        throw error;
      }
    });
  } catch (error) {
    if (installed) installed.rollback();
    throw error;
  }
  installed.commit();
  await audit(req, 'backup.club_import', 'club', result.clubId, { package_id: payload.packageId, records: result.records });
  return result;
}

function schemaSignature(database, omitNewBackupObjects = false) {
  const omitted = omitNewBackupObjects
    ? new Set(['backup_imports', 'chat_attachments', 'chat_attachments_message_idx'])
    : new Set();
  return database.prepare(`SELECT type, name, tbl_name, sql FROM sqlite_master
    WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type, name`)
    .all()
    .filter(row => !omitted.has(row.name))
    .map(row => [row.type, row.name, row.tbl_name, row.sql]);
}

function validateFullDatabase(file) {
  const Database = db.constructor;
  let restoreDb;
  try {
    restoreDb = new Database(file);
    restoreDb.exec('PRAGMA foreign_keys=ON');
    const check = restoreDb.prepare('PRAGMA integrity_check').all();
    if (check.length !== 1 || Object.values(check[0])[0] !== 'ok') throw new Error('Database integrity check failed.');
    if (JSON.stringify(schemaSignature(restoreDb, true)) !== JSON.stringify(schemaSignature(db, true))) {
      throw new Error('The database schema is not a trusted DinkNest schema.');
    }
    require('../../scripts/migrate').migrate(restoreDb);
    if (!restoreDb.prepare(`SELECT 1 FROM users WHERE role='super_admin' AND status='active' LIMIT 1`).get()) {
      throw new Error('The restored database has no active Super Admin.');
    }
    const violations = restoreDb.prepare('PRAGMA foreign_key_check').all();
    if (violations.length) throw new Error('The restored database contains invalid references.');
    if (JSON.stringify(schemaSignature(restoreDb)) !== JSON.stringify(schemaSignature(db))) {
      throw new Error('The database schema is not compatible with this DinkNest installation.');
    }
    return true;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(422, error.message || 'The database in this backup is not valid.', 'INVALID_BACKUP');
  } finally {
    if (restoreDb && restoreDb.open) restoreDb.close();
  }
}

async function importFull(req, buffer) {
  requireRole(req, 'super_admin');
  if (env.databaseFile === ':memory:') throw new HttpError(409, 'A memory database cannot be restored.');
  const isLegacyDatabase = Buffer.isBuffer(buffer) && buffer.subarray(0, 16).toString('ascii') === 'SQLite format 3\0';
  const payload = isLegacyDatabase
    ? { packageId: crypto.randomUUID(), database: buffer.toString('base64'), databaseSha256: hash(buffer), files: [] }
    : decodeArchive(buffer, 'full');
  if (typeof payload.database !== 'string' || !/^[0-9a-f]{64}$/.test(payload.databaseSha256 || '')) {
    throw new HttpError(422, 'This full backup is missing its database file.', 'INVALID_BACKUP');
  }
  const databaseBytes = Buffer.from(payload.database, 'base64');
  if (!databaseBytes.length || databaseBytes.toString('base64') !== payload.database || hash(databaseBytes) !== payload.databaseSha256) {
    throw new HttpError(422, 'The database in this backup failed its integrity check.', 'INVALID_BACKUP');
  }
  const files = validateFiles(payload.files);
  const temporaryDb = path.join(backupDir(), `.restore-${crypto.randomUUID()}.db`);
  fs.writeFileSync(temporaryDb, databaseBytes, { flag: 'wx' });
  try {
    validateFullDatabase(temporaryDb);
    const safety = await createFull(req);
    let installed;
    try {
      await withExclusiveConnection(async database => {
        database.prepare('ATTACH DATABASE ? AS restore_source').run(temporaryDb);
        try {
          const sourceTables = database.prepare('SELECT name FROM restore_source.sqlite_master WHERE type=? AND name NOT LIKE ? ORDER BY rowid')
            .all('table', 'sqlite_%').map(row => row.name);
          const targetTables = tableNames(database);
          if (JSON.stringify([...sourceTables].sort()) !== JSON.stringify([...targetTables].sort())) {
            throw new HttpError(422, 'The database schema changed while preparing the restore.', 'INCOMPATIBLE_BACKUP');
          }
          installed = installFiles(files);
          database.exec('BEGIN IMMEDIATE');
          database.exec('PRAGMA defer_foreign_keys=ON');
          for (const table of [...targetTables].reverse()) database.exec(`DELETE FROM main.${quote(table)}`);
          if (database.prepare(`SELECT 1 FROM main.sqlite_master WHERE type='table' AND name='sqlite_sequence'`).get()) {
            database.exec('DELETE FROM main.sqlite_sequence');
          }
          for (const table of sourceTables) database.exec(`INSERT INTO main.${quote(table)} SELECT * FROM restore_source.${quote(table)}`);
          if (database.prepare(`SELECT 1 FROM restore_source.sqlite_master WHERE type='table' AND name='sqlite_sequence'`).get()) {
            const sequences = database.prepare('SELECT name, seq FROM restore_source.sqlite_sequence').all();
            const insertSequence = database.prepare('INSERT OR REPLACE INTO main.sqlite_sequence (name, seq) VALUES (?, ?)');
            for (const sequence of sequences) insertSequence.run(sequence.name, sequence.seq);
          }
          const violations = database.prepare('PRAGMA foreign_key_check').all();
          if (violations.length) throw new HttpError(422, 'The database restore would leave invalid record references.', 'BACKUP_FOREIGN_KEY');
          database.exec('COMMIT');
        } catch (error) {
          try { database.exec('ROLLBACK'); } catch { /* the transaction may already have rolled back */ }
          if (installed) { installed.rollback(); installed = null; }
          throw error;
        } finally {
          database.exec('DETACH DATABASE restore_source');
        }
      });
    } catch (error) {
      if (installed) installed.rollback();
      throw error;
    }
    installed.commit();
    await audit(req, 'backup.full_import', 'backup', payload.packageId, { safety_backup: safety.name });
    return { packageId: payload.packageId, files: files.length, safetyBackup: safety.name, reauthenticationRequired: true };
  } finally {
    if (fs.existsSync(temporaryDb)) fs.unlinkSync(temporaryDb);
  }
}

module.exports = {
  archivePath, createClub, createFull, decodeArchive, importClub, importFull,
  listFull, makeClubArchive, validateFiles, FORMAT, VERSION,
};
