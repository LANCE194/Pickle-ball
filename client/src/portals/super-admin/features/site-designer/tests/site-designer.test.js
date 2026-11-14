import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

test('super-admin/site-designer: registers the shared designer page', () => {
  const feature = path.join(here, '..');
  const manifest = fs.readFileSync(path.join(feature, 'index.js'), 'utf8');
  const routes = fs.readFileSync(path.join(feature, 'routes.js'), 'utf8');
  const page = fs.readFileSync(path.join(feature, '..', '..', '..', 'admin', 'features', 'site-designer', 'pages', 'SiteDesignerPage.jsx'), 'utf8');
  assert.match(manifest, /key: 'super-admin\.site-designer'/);
  assert.match(routes, /admin\/features\/site-designer\/pages\/SiteDesignerPage\.jsx/);
  assert.match(page, /Admin designs waiting for review/);
  assert.match(page, /Preview submitted design/);
});
