import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.modules',
  role: 'super-admin',
  featureKey: null,
  label: "Modules",
  icon: 'puzzle',
  path: 'modules',
  order: 4,
  menuGroup: 'System',
  tab: null,
  routes,
};
