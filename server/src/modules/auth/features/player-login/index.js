// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'auth.player-login',
  folder: 'player-login',
  featureKey: null,
  label: "Player login",
  mountPath: '/api/auth/player-login',
  roles: [],
  order: 1,
  router: require('./routes'),
};
