module.exports = {
  key: 'super-admin.site-designer',
  folder: 'site-designer',
  featureKey: null,
  label: 'Site Designer',
  mountPath: '/api/super-admin/site-designer',
  order: 10,
  router: require('../../../admin/features/site-designer/routes'),
};
