module.exports = {
  key: 'staff.account-profile',
  folder: 'account-profile',
  featureKey: null,
  label: 'My Profile',
  mountPath: '/api/staff/account-profile',
  roles: ['staff'],
  order: 90,
  router: require('../../../../shared/features/account-profile/routes'),
};
