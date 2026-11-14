// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.site-designer',
  folder: 'site-designer',
  featureKey: 'site_designer',
  label: "Site Designer",
  mountPath: '/api/admin/site-designer',
  roles: ["admin","super_admin"],
  order: 11,
  router: require('./routes'),
};
