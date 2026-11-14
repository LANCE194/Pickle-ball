import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

test('admin/backups: has a registered page and documents the club-only export', () => {
  for (const file of ['index.js', 'README.md', 'routes.js', 'pages/BackupsPage.jsx']) {
    assert.ok(fs.existsSync(path.join(here, '..', file)), file);
  }
  const page = fs.readFileSync(path.join(here, '..', 'pages/BackupsPage.jsx'), 'utf8');
  assert.match(page, /api\/admin\/backups\/export/);
  assert.match(page, /api\/admin\/backups\/send/);
});
