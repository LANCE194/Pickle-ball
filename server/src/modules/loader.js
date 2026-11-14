// Discovers every role folder and every feature folder (via its index.js manifest) and mounts them.
// Server routes mount as /api/<role>/<feature-folder>/... : requireRole at the role level, requireFeature at the feature level.
const fs = require('fs');
const path = require('path');
const express = require('express');
const requireRole = require('../middleware/requireRole');
const requireFeature = require('../middleware/requireFeature');
const { requireAuth } = require('../middleware/auth');
const registry = [];
function loadRole(roleDir) {
  const mod = require(path.join(__dirname, roleDir, 'index.js')); // role index.js auto-loads features/*/index.js
  return mod;
}
function mountAll(app, { superAdminPath = '' } = {}) {
  const roleDirs = fs.readdirSync(__dirname, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
  for (const dir of roleDirs) {
    const role = loadRole(dir);
    for (const m of role.features) {
      const base = dir === 'auth' ? `/api/auth/${m.folder}` : `/api/${dir}/${m.folder}`;
      const chain = [];
      if (dir === 'super-admin') base && chain.push(requireAuth, requireRole(['super_admin']));
      else if (dir !== 'auth' && dir !== 'guest') chain.push(requireAuth, requireRole(m.roles || role.roles));
      if (m.featureKey) chain.push(requireFeature(m.featureKey));
      if (dir === 'auth' && m.folder === 'super-admin-login') {
        if (superAdminPath) app.use(`/api/${superAdminPath}`, m.router); // private entrance: path comes from SUPER_ADMIN_PATH
      } else app.use(base, ...chain, m.router);
      registry.push({ role: dir, key: m.key, folder: m.folder, label: m.label, featureKey: m.featureKey, mount: dir === 'auth' && m.folder === 'super-admin-login' ? '(private)' : base, roles: m.roles || role.roles });
    }
  }
  return registry;
}
module.exports = { mountAll, registry };
