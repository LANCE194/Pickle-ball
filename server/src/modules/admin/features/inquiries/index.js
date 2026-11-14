// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.inquiries',
  folder: 'inquiries',
  featureKey: 'inquiries',
  label: "Inquiries",
  mountPath: '/api/admin/inquiries',
  roles: ["admin","super_admin"],
  order: 13,
  router: require('./routes'),
};
