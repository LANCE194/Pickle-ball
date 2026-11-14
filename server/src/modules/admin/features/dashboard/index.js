// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.dashboard',
  folder: 'dashboard',
  featureKey: 'reports_dashboards',
  label: "Dashboard",
  mountPath: '/api/admin/dashboard',
  roles: ["admin","super_admin"],
  order: 1,
  router: require('./routes'),
};
