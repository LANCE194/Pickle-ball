// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.backups',
  folder: 'backups',
  featureKey: null,
  label: "Backups",
  mountPath: '/api/super-admin/backups',
  roles: ["super_admin"],
  order: 7,
  router: require('./routes'),
};
