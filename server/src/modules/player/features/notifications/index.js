// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.notifications',
  folder: 'notifications',
  featureKey: null,
  label: "Notifications",
  mountPath: '/api/player/notifications',
  roles: ["player"],
  order: 9,
  router: require('./routes'),
};
