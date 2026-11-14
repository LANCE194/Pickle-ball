// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.modules',
  folder: 'modules',
  featureKey: null,
  label: "Modules",
  mountPath: '/api/super-admin/modules',
  roles: ["super_admin"],
  order: 4,
  router: require('./routes'),
};
