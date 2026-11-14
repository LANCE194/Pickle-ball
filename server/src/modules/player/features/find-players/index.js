// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.find-players',
  folder: 'find-players',
  featureKey: 'open_play',
  label: "Find Players",
  mountPath: '/api/player/find-players',
  roles: ["player"],
  order: 4,
  router: require('./routes'),
};
