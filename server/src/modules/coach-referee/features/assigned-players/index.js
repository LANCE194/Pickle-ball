// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'coach-referee.assigned-players',
  folder: 'assigned-players',
  featureKey: 'player_profiles_skill',
  label: "Players",
  mountPath: '/api/coach-referee/assigned-players',
  roles: ["coach_referee"],
  order: 3,
  router: require('./routes'),
};
