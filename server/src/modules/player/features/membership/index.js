// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.membership',
  folder: 'membership',
  featureKey: 'memberships',
  label: "Membership",
  mountPath: '/api/player/membership',
  roles: ["player"],
  order: 10,
  router: require('./routes'),
};
