import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

test('staff/account-profile: manifest and shared page are present', () => {
  const manifest = fs.readFileSync(path.join(here, '..', 'index.js'), 'utf8');
  assert.match(manifest, /role: 'staff'/);
  assert.match(manifest, /path: 'profile'/);
  assert.ok(fs.existsSync(path.join(here, '..', 'pages', 'AccountProfilePage.jsx')));
});
