// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.tournaments',
  folder: 'tournaments',
  featureKey: 'tournaments',
  label: "Tournaments",
  mountPath: '/api/admin/tournaments',
  roles: ["admin","super_admin"],
  order: 5,
  router: require('./routes'),
};
