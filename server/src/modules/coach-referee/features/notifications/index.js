// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'coach-referee.notifications',
  folder: 'notifications',
  featureKey: null,
  label: "Notifications",
  mountPath: '/api/coach-referee/notifications',
  roles: ["coach_referee"],
  order: 5,
  router: require('./routes'),
};
