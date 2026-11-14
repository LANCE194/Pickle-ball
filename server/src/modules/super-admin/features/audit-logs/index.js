// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'super-admin.audit-logs',
  folder: 'audit-logs',
  featureKey: null,
  label: "Audit Logs",
  mountPath: '/api/super-admin/audit-logs',
  roles: ["super_admin"],
  order: 5,
  router: require('./routes'),
};
