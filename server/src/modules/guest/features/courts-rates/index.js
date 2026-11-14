// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.courts-rates',
  folder: 'courts-rates',
  featureKey: 'guest_portal',
  label: "Courts and Rates",
  mountPath: '/api/guest/courts-rates',
  roles: ["guest"],
  order: 2,
  router: require('./routes'),
};
