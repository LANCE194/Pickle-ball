// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.dashboard',
  folder: 'dashboard',
  featureKey: 'reports_dashboards',
  label: "Dashboard",
  mountPath: '/api/staff/dashboard',
  roles: ["staff"],
  order: 1,
  router: require('./routes'),
};
