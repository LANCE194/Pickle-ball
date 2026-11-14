// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.check-in',
  folder: 'check-in',
  featureKey: 'checkin_attendance',
  label: "Check-in",
  mountPath: '/api/staff/check-in',
  roles: ["staff"],
  order: 5,
  router: require('./routes'),
};
