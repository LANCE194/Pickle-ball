import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

test('shared chat manifest and page provide the feature to every authenticated portal', () => {
  const portalLoader = fs.readFileSync(path.resolve(here, '../../../../../app/portals.js'), 'utf8');
  const manifest = fs.readFileSync(path.resolve(here, '..', 'index.js'), 'utf8');
  const page = fs.readFileSync(path.resolve(here, '..', 'pages/ChatPage.jsx'), 'utf8');
  assert.match(portalLoader, /portals\/shared\//);
  assert.match(portalLoader, /slug !== 'guest'/);
  assert.match(manifest, /featureKey: 'chat_messages'/);
  assert.match(page, /\/api\/chat\/messages/);
  assert.match(page, /All allowed roles/);
  assert.match(page, /CONTACT_ROLES/);
  assert.doesNotMatch(page, /<button[\s>]/);
});
