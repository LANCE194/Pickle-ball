// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.my-schedule',
  folder: 'my-schedule',
  featureKey: null,
  label: "My Schedule",
  mountPath: '/api/player/my-schedule',
  roles: ["player"],
  order: 3,
  router: require('./routes'),
};
