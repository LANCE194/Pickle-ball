// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.events',
  folder: 'events',
  featureKey: 'events_announcements',
  label: "Events",
  mountPath: '/api/player/events',
  roles: ["player"],
  order: 6,
  router: require('./routes'),
};
