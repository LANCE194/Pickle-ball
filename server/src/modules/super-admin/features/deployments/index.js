// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.deployments',
  folder: 'deployments',
  featureKey: null,
  label: "Deployments",
  mountPath: '/api/super-admin/deployments',
  roles: ["super_admin"],
  order: 2,
  router: require('./routes'),
};
