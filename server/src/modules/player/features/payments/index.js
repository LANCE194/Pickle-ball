// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.payments',
  folder: 'payments',
  featureKey: null,
  label: "Payments",
  mountPath: '/api/player/payments',
  roles: ["player"],
  order: 8,
  router: require('./routes'),
};
