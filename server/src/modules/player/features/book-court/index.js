// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'player.book-court',
  folder: 'book-court',
  featureKey: null,
  label: "Book Court",
  mountPath: '/api/player/book-court',
  roles: ["player"],
  order: 2,
  router: require('./routes'),
};
