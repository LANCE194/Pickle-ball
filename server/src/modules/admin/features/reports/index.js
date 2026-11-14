// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.reports',
  folder: 'reports',
  featureKey: 'reports_dashboards',
  label: "Reports",
  mountPath: '/api/admin/reports',
  roles: ["admin","super_admin"],
  order: 9,
  router: require('./routes'),
};
