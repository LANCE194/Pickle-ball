// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.players-members',
  folder: 'players-members',
  featureKey: null,
  label: "Members",
  mountPath: '/api/staff/players-members',
  roles: ["staff"],
  order: 7,
  router: require('./routes'),
};
