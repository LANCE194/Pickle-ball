// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.bookings',
  folder: 'bookings',
  featureKey: null,
  label: "Bookings",
  mountPath: '/api/staff/bookings',
  roles: ["staff"],
  order: 2,
  router: require('./routes'),
};
