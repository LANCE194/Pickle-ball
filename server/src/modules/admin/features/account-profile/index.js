module.exports = {
  key: 'admin.account-profile',
  folder: 'account-profile',
  featureKey: null,
  label: 'My Profile',
  mountPath: '/api/admin/account-profile',
  roles: ['admin'],
  order: 90,
  router: require('../../../../shared/features/account-profile/routes'),
};
