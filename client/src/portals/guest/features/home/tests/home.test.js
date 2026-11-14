import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
test('guest/home: has manifest, README and main page', () => {
  for (const f of ['index.js', 'README.md', 'routes.js', 'pages/HomePage.jsx']) assert.ok(fs.existsSync(path.join(here, '..', f)), f);
});
test('guest/home: uses shared components only (no own button/card styles)', () => {
  const src = fs.readFileSync(path.join(here, '..', 'pages/HomePage.jsx'), 'utf8');
  assert.ok(!/<button[\s>]/.test(src), 'use the shared Button');
});
test('guest/home: renders the shared public and designer site preview', () => {
  const home = fs.readFileSync(path.join(here, '..', 'pages/HomePage.jsx'), 'utf8');
  const designer = fs.readFileSync(path.resolve(here, '../../../../admin/features/site-designer/pages/SiteDesignerPage.jsx'), 'utf8');
  assert.match(home, /SitePreview/);
  assert.match(home, /isLive/);
  assert.match(designer, /SitePreview/);
});
