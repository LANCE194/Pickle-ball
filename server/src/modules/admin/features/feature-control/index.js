// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.feature-control',
  folder: 'feature-control',
  featureKey: null,
  label: "Feature Control",
  mountPath: '/api/admin/feature-control',
  roles: ["admin","super_admin"],
  order: 12,
  router: require('./routes'),
};
