// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.sessions',
  folder: 'sessions',
  featureKey: null,
  label: "Sessions",
  mountPath: '/api/super-admin/sessions',
  roles: ["super_admin"],
  order: 6,
  router: require('./routes'),
};
