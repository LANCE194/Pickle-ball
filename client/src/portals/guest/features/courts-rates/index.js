import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.courts-rates',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "Courts and Rates",
  icon: 'grid',
  path: 'courts',
  order: 2,
  menuGroup: 'Public',
  tab: null,
  routes,
};
