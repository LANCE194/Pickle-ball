// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.settings',
  folder: 'settings',
  featureKey: null,
  label: "Settings",
  mountPath: '/api/admin/settings',
  roles: ["admin","super_admin"],
  order: 14,
  router: require('./routes'),
};
