// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'guest.about-contact-inquiry',
  folder: 'about-contact-inquiry',
  featureKey: 'guest_portal',
  label: "About / Contact",
  mountPath: '/api/guest/about-contact-inquiry',
  roles: ["guest"],
  order: 6,
  router: require('./routes'),
};
