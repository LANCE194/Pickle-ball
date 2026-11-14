// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.staff-management',
  folder: 'staff-management',
  featureKey: null,
  label: "Staff",
  mountPath: '/api/admin/staff-management',
  roles: ["admin","super_admin"],
  order: 7,
  router: require('./routes'),
};
