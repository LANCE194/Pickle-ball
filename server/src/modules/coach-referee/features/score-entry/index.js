// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'coach-referee.score-entry',
  folder: 'score-entry',
  featureKey: 'tournaments',
  label: "Score Entry",
  mountPath: '/api/coach-referee/score-entry',
  roles: ["coach_referee"],
  order: 2,
  router: require('./routes'),
};
