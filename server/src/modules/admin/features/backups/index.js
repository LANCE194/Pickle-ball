module.exports = {
  key: 'admin.backups',
  folder: 'backups',
  label: 'Backups',
  mountPath: '/api/admin/backups',
  roles: ['admin'],
  order: 90,
  router: require('./routes'),
};
