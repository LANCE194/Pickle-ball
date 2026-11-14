// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'auth.super-admin-login',
  folder: 'super-admin-login',
  featureKey: null,
  label: "Super Admin login",
  mountPath: '/api/auth/super-admin-login',
  roles: [],
  order: 4,
  router: require('./routes'),
};
