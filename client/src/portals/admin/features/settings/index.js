import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.settings',
  role: 'admin',
  featureKey: null,
  label: "Settings",
  icon: 'settings',
  path: 'settings',
  order: 14,
  menuGroup: 'Club',
  tab: null,
  routes,
};
