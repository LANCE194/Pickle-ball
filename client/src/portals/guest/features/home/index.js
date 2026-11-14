import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.home',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "Home",
  icon: 'home',
  path: '',
  order: 1,
  menuGroup: 'Public',
  tab: null,
  routes,
};
