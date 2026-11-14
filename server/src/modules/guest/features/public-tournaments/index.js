// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.public-tournaments',
  folder: 'public-tournaments',
  featureKey: 'guest_portal',
  label: "Tournaments",
  mountPath: '/api/guest/public-tournaments',
  roles: ["guest"],
  order: 5,
  router: require('./routes'),
};
