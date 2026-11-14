import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
test('super-admin/audit-logs: has manifest, README and main page', () => {
  for (const f of ['index.js', 'README.md', 'routes.js', 'pages/AuditLogsPage.jsx']) assert.ok(fs.existsSync(path.join(here, '..', f)), f);
});
test('super-admin/audit-logs: uses shared components only (no own button/card styles)', () => {
  const src = fs.readFileSync(path.join(here, '..', 'pages/AuditLogsPage.jsx'), 'utf8');
  assert.ok(!/<button[\s>]/.test(src), 'use the shared Button');
});
