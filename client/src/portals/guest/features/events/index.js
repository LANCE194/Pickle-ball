import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.events',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "Events",
  icon: 'megaphone',
  path: 'events',
  order: 4,
  menuGroup: 'Public',
  tab: null,
  routes,
};
