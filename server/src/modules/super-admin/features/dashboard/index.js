module.exports = {
  key: 'super-admin.dashboard',
  folder: 'dashboard',
  featureKey: null,
  label: 'Platform dashboard',
  mountPath: '/api/super-admin/dashboard',
  roles: ['super_admin'],
  order: 1,
  router: require('./routes'),
};
