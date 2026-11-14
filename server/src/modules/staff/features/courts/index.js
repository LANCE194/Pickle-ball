// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.courts',
  folder: 'courts',
  featureKey: null,
  label: "Courts",
  mountPath: '/api/staff/courts',
  roles: ["staff"],
  order: 4,
  router: require('./routes'),
};
