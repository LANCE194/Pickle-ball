// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.system-settings',
  folder: 'system-settings',
  featureKey: null,
  label: "Settings",
  mountPath: '/api/super-admin/system-settings',
  roles: ["super_admin"],
  order: 8,
  router: require('./routes'),
};
