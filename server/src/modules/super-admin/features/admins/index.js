// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.admins',
  folder: 'admins',
  featureKey: null,
  label: "Admins",
  mountPath: '/api/super-admin/admins',
  roles: ["super_admin"],
  order: 1,
  router: require('./routes'),
};
