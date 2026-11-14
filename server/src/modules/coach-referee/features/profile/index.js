// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'coach-referee.profile',
  folder: 'profile',
  featureKey: null,
  label: "Profile",
  mountPath: '/api/coach-referee/profile',
  roles: ["coach_referee"],
  order: 4,
  router: require('./routes'),
};
