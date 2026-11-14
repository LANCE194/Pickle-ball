module.exports = {
  key: 'super-admin.domains',
  folder: 'domains',
  featureKey: null,
  label: 'Domains',
  mountPath: '/api/super-admin/domains',
  roles: ['super_admin'],
  order: 9,
  router: require('./routes'),
};
