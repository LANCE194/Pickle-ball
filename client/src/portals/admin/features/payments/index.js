import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.payments',
  role: 'admin',
  featureKey: null,
  label: "Payments",
  icon: 'wallet',
  path: 'payments',
  order: 3,
  menuGroup: 'Main',
  tab: 3,
  routes,
};
