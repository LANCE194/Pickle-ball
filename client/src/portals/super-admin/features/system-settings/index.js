import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.system-settings',
  role: 'super-admin',
  featureKey: null,
  label: "Settings",
  icon: 'settings',
  path: 'settings',
  order: 8,
  menuGroup: 'System',
  tab: null,
  routes,
};
