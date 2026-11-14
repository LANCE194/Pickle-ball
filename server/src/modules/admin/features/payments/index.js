// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.payments',
  folder: 'payments',
  featureKey: null,
  label: "Payments",
  mountPath: '/api/admin/payments',
  roles: ["admin","super_admin"],
  order: 3,
  router: require('./routes'),
};
