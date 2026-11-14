// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.events',
  folder: 'events',
  featureKey: 'events_announcements',
  label: "Events",
  mountPath: '/api/staff/events',
  roles: ["staff"],
  order: 8,
  router: require('./routes'),
};
