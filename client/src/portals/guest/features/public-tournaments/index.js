import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.public-tournaments',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "Tournaments",
  icon: 'trophy',
  path: 'tournaments',
  order: 5,
  menuGroup: 'Public',
  tab: null,
  routes,
};
