// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.courts-rates',
  folder: 'courts-rates',
  featureKey: null,
  label: "Courts and Rates",
  mountPath: '/api/admin/courts-rates',
  roles: ["admin","super_admin"],
  order: 4,
  router: require('./routes'),
};
