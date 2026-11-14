// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.qr-settings',
  folder: 'qr-settings',
  featureKey: 'qr_payments',
  label: "QR Settings",
  mountPath: '/api/admin/qr-settings',
  roles: ["admin","super_admin"],
  order: 8,
  router: require('./routes'),
};
