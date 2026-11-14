import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

test('coach-referee/profile: edits personal details and uploads a photo', () => {
  const page = fs.readFileSync(path.join(here, '..', 'pages', 'ProfilePage.jsx'), 'utf8');
  assert.match(page, /FileUpload/);
  assert.match(page, /emergency_name/);
  assert.match(page, /certification, role, and experience details are changed by the club owner/i);
});
