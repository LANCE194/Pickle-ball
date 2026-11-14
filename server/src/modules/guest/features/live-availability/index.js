// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.live-availability',
  folder: 'live-availability',
  featureKey: 'guest_portal',
  label: "Schedule",
  mountPath: '/api/guest/live-availability',
  roles: ["guest"],
  order: 3,
  router: require('./routes'),
};
