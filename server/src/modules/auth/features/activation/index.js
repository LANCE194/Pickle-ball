// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'auth.activation',
  folder: 'activation',
  featureKey: null,
  label: "Activation",
  mountPath: '/api/auth/activation',
  roles: [],
  order: 2,
  router: require('./routes'),
};
