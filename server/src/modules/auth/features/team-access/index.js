// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'auth.team-access',
  folder: 'team-access',
  featureKey: null,
  label: "Team access",
  mountPath: '/api/auth/team-access',
  roles: [],
  order: 3,
  router: require('./routes'),
};
