// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.launch-status',
  folder: 'launch-status',
  featureKey: null,
  label: "Launch status",
  mountPath: '/api/super-admin/launch-status',
  roles: ["super_admin"],
  order: 9,
  router: require('./routes'),
};
