// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.bookings',
  folder: 'bookings',
  featureKey: null,
  label: "Bookings",
  mountPath: '/api/admin/bookings',
  roles: ["admin","super_admin"],
  order: 2,
  router: require('./routes'),
};
