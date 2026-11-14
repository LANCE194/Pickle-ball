import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const feature = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('super-admin/domains: manifest and page are registered', () => {
  const manifest = fs.readFileSync(path.join(feature, 'index.js'), 'utf8');
  assert.match(manifest, /key: 'super-admin\.domains'/);
  assert.match(manifest, /path: 'domains'/);
  assert.ok(fs.existsSync(path.join(feature, 'pages', 'DomainsPage.jsx')));
  assert.ok(fs.existsSync(path.join(feature, 'README.md')));
});

test('super-admin/domains: page explains and gates domain activation', () => {
  const source = fs.readFileSync(path.join(feature, 'pages', 'DomainsPage.jsx'), 'utf8');
  assert.match(source, /verify-dns/);
  assert.match(source, /https-ready/);
  assert.match(source, /confirmed: true/);
});
