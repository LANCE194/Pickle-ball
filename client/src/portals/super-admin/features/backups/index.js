import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.backups',
  role: 'super-admin',
  featureKey: null,
  label: "Backups",
  icon: 'archive',
  path: 'backups',
  order: 7,
  menuGroup: 'System',
  tab: null,
  routes,
};
