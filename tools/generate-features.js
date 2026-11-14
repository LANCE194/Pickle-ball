// Creates the manifest (index.js), README.md and tests/ for EVERY feature folder from tools/catalog.js, on the server and the client.
// It never overwrites files that exist (so hand-written routes/pages stay). Run: npm run generate
const fs = require('fs'), path = require('path');
const catalog = require('./catalog');
const SERVER = path.join(__dirname, '../server/src/modules'), CLIENT = path.join(__dirname, '../client/src/portals');
const put = (file, text, overwrite = false) => { fs.mkdirSync(path.dirname(file), { recursive: true }); if (overwrite || !fs.existsSync(file)) fs.writeFileSync(file, text); };
const pascal = s => s.split(/[-_]/).map(x => x[0].toUpperCase() + x.slice(1)).join('');
const roleLoader = `// Role loader: discovers every features/*/index.js manifest automatically (no central file to edit).
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'features');
const features = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => require(path.join(dir, d.name))).sort((a, b) => (a.order || 0) - (b.order || 0));
module.exports = { roles: ROLES, features };
`;
const problems = [];
for (const r of catalog) {
  const sdir = path.join(SERVER, r.slug), cdir = path.join(CLIENT, r.slug);
  put(path.join(sdir, 'index.js'), roleLoader.replace('ROLES', JSON.stringify(r.roles)), true);
  for (const f of r.features) {
    const sf = path.join(sdir, 'features', f.folder), cf = path.join(cdir, 'features', f.folder);
    for (const need of ['routes.js', 'controller.js', 'service.js']) if (!fs.existsSync(path.join(sf, need))) problems.push(`missing ${path.relative(SERVER, sf)}/${need}`);
    const mount = r.slug === 'auth' ? `/api/auth/${f.folder}` : `/api/${r.slug}/${f.folder}`;
    put(path.join(sf, 'index.js'), `// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: '${r.slug}.${f.folder}',
  folder: '${f.folder}',
  featureKey: ${f.featureKey ? `'${f.featureKey}'` : 'null'},
  label: ${JSON.stringify(f.label)},
  mountPath: '${mount}',
  roles: ${JSON.stringify(r.roles)},
  order: ${f.order},
  router: require('./routes'),
};
`, true);
    put(path.join(sf, 'README.md'), `# ${r.slug} / ${f.folder} - ${f.label}

**Purpose:** ${f.label} for the ${r.slug.replace('-', ' ')} role.
**Feature key:** ${f.featureKey || 'core (always on)'}
**Roles:** ${r.roles.join(', ') || 'public'}
**Tables used:** ${f.tables.length ? f.tables.join(', ') : 'none'}

## Endpoints (mounted at \`${mount}\`)
${f.endpoints.length ? f.endpoints.map(e => `- \`${e.split(' ')[0]} ${mount}${e.split(' ')[1] === '/' ? '' : e.split(' ')[1]}\` - roles: ${r.roles.join(', ') || 'public'}${f.featureKey ? ` - feature: ${f.featureKey}` : ''}`).join('\n') : '- none (screens only)'}

## Notes
- Permission differences are decided in this folder's \`service.js\`, not by role checks in shared code.
- Shared logic lives in \`server/src/shared/services\`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and \`tests/\` together.
`, true);
    put(path.join(sf, 'tests', `${f.folder}.test.js`), `const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
test('${r.slug}/${f.folder}: manifest is complete and has a README', () => {
  const m = require('../index.js');
  assert.equal(m.folder, '${f.folder}');
  assert.ok(typeof m.router === 'function', 'router must be an express router');
  assert.ok(m.mountPath.startsWith('/api/'));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'README.md')));
});
test('${r.slug}/${f.folder}: does not import from another feature or role', () => {
  for (const file of ['routes.js', 'controller.js', 'service.js', 'validator.js']) {
    const p = path.join(__dirname, '..', file); if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    assert.ok(!/require\\(['"]\\.\\.\\/\\.\\.\\/(?!\\.)/.test(src) || !/features\\//.test(src), 'no cross-feature imports');
    assert.ok(!/require\\(['"][^'"]*modules\\/[^'"]*['"]\\)/.test(src.replace(/require\\('\\.\\.\\/\\.\\.\\/loader'\\)/, '')), 'no role imports');
  }
});
`, true);
    // ---- client ----
    const page = `${pascal(f.folder)}Page`;
    put(path.join(cf, 'README.md'), `# client ${r.slug} / ${f.folder} - ${f.label}\n\nScreens for **${f.label}** (${r.slug}). Built only from \`client/src/shared/components\`.\n\n- Feature key: ${f.featureKey || 'core'}\n- Menu: group "${f.group}", order ${f.order}${f.tab ? `, mobile tab ${f.tab}` : ''}\n- API: see \`api.js\`; server endpoints are listed in \`server/src/modules/${r.slug}/features/${f.folder}/README.md\`.\n- Edit this folder, its README and \`tests/\` together.\n`, true);
    put(path.join(cf, 'constants.js'), `export const FEATURE = { key: '${r.slug}.${f.folder}', featureKey: ${f.featureKey ? `'${f.featureKey}'` : 'null'}, label: ${JSON.stringify(f.label)}, base: '${mount}' };\n`, true);
    put(path.join(cf, 'api.js'), `import { api } from '../../../../shared/lib/api';\nimport { FEATURE } from './constants';\n// Thin helpers around the shared api client. Paths are relative to ${mount}.\nexport const get = (p = '', q) => api.get(FEATURE.base + p, q);\nexport const post = (p = '', b) => api.post(FEATURE.base + p, b);\nexport const patch = (p = '', b) => api.patch(FEATURE.base + p, b);\nexport const put = (p = '', b) => api.put(FEATURE.base + p, b);\nexport const del = (p = '') => api.del(FEATURE.base + p);\nexport const upload = (p, form) => api.upload(FEATURE.base + p, form);\n`, true);
    put(path.join(cf, 'hooks', 'useFeatureData.js'), `import { useApi } from '../../../../../shared/hooks/useApi';\nimport { FEATURE } from '../constants';\n// Loads a list from this feature's API and re-loads when the server pushes a change.\nexport const useFeatureData = (path = '', params) => useApi(FEATURE.base + path, params);\n`, true);
    put(path.join(cf, 'components', 'index.js'), `// Feature-only components go here. Anything used by more than one feature belongs in client/src/shared/components.\nexport {};\n`);
    put(path.join(cf, 'tests', `${f.folder}.test.js`), `import { test } from 'node:test';\nimport assert from 'node:assert';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst here = path.dirname(fileURLToPath(import.meta.url));\ntest('${r.slug}/${f.folder}: has manifest, README and main page', () => {\n  for (const f of ['index.js', 'README.md', 'routes.js', 'pages/${page}.jsx']) assert.ok(fs.existsSync(path.join(here, '..', f)), f);\n});\ntest('${r.slug}/${f.folder}: uses shared components only (no own button/card styles)', () => {\n  const src = fs.readFileSync(path.join(here, '..', 'pages/${page}.jsx'), 'utf8');\n  assert.ok(!/<button[\\s>]/.test(src), 'use the shared Button');\n});\n`, true);
    if (!fs.existsSync(path.join(cf, 'pages', `${page}.jsx`))) problems.push(`missing client page ${r.slug}/${f.folder}/pages/${page}.jsx`);
    put(path.join(cf, 'routes.js'), `import { lazy } from 'react';\n// Each route is lazy loaded so a role only downloads the screens it opens.\nexport default [{ path: '${f.path}', component: lazy(() => import('./pages/${page}.jsx')) }];\n`);
    put(path.join(cf, 'index.js'), `import routes from './routes';\n// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).\nexport default {\n  key: '${r.slug}.${f.folder}',\n  role: '${r.slug}',\n  featureKey: ${f.featureKey ? `'${f.featureKey}'` : 'null'},\n  label: ${JSON.stringify(f.label)},\n  icon: '${f.icon}',\n  path: '${f.path}',\n  order: ${f.order},\n  menuGroup: '${f.group}',\n  tab: ${f.tab || 'null'},\n  routes,\n};\n`, true);
  }
}
console.log(problems.length ? 'TO DO:\n' + problems.join('\n') : 'All feature folders complete.');
