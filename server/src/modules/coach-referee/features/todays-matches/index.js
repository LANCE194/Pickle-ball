// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'coach-referee.todays-matches',
  folder: 'todays-matches',
  featureKey: 'tournaments',
  label: "Today's Matches",
  mountPath: '/api/coach-referee/todays-matches',
  roles: ["coach_referee"],
  order: 1,
  router: require('./routes'),
};
