import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.about-contact-inquiry',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "About / Contact",
  icon: 'info',
  path: 'about',
  order: 6,
  menuGroup: 'Public',
  tab: null,
  routes,
};
