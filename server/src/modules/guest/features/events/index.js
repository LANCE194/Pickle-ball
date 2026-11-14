// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.events',
  folder: 'events',
  featureKey: 'guest_portal',
  label: "Events",
  mountPath: '/api/guest/events',
  roles: ["guest"],
  order: 4,
  router: require('./routes'),
};
