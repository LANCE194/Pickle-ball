// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.player-login-activation',
  folder: 'player-login-activation',
  featureKey: null,
  label: "Player Login",
  mountPath: '/api/guest/player-login-activation',
  roles: ["guest"],
  order: 7,
  router: require('./routes'),
};
