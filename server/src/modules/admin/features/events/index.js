// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.events',
  folder: 'events',
  featureKey: 'events_announcements',
  label: "Events",
  mountPath: '/api/admin/events',
  roles: ["admin","super_admin"],
  order: 10,
  router: require('./routes'),
};
