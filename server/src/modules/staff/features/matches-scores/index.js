// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.matches-scores',
  folder: 'matches-scores',
  featureKey: 'tournaments',
  label: "Matches",
  mountPath: '/api/staff/matches-scores',
  roles: ["staff"],
  order: 6,
  router: require('./routes'),
};
