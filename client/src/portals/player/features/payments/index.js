import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.payments',
  role: 'player',
  featureKey: null,
  label: "Payments",
  icon: 'wallet',
  path: 'payments',
  order: 8,
  menuGroup: 'Me',
  tab: null,
  routes,
};
