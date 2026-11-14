// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.feature-availability',
  folder: 'feature-availability',
  featureKey: null,
  label: "Features",
  mountPath: '/api/super-admin/feature-availability',
  roles: ["super_admin"],
  order: 3,
  router: require('./routes'),
};
