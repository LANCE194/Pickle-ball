// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.my-profile-level',
  folder: 'my-profile-level',
  featureKey: null,
  label: "My Profile and Level",
  mountPath: '/api/player/my-profile-level',
  roles: ["player"],
  order: 7,
  router: require('./routes'),
};
