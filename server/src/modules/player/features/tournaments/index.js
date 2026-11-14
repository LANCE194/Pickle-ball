// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.tournaments',
  folder: 'tournaments',
  featureKey: 'tournaments',
  label: "Tournaments",
  mountPath: '/api/player/tournaments',
  roles: ["player"],
  order: 5,
  router: require('./routes'),
};
