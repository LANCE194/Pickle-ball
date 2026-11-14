// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.home',
  folder: 'home',
  featureKey: 'guest_portal',
  label: "Home",
  mountPath: '/api/guest/home',
  roles: ["guest"],
  order: 1,
  router: require('./routes'),
};
