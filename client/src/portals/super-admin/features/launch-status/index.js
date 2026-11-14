import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.launch-status',
  role: 'super-admin',
  featureKey: null,
  label: "Launch status",
  icon: 'flag',
  path: 'launch',
  order: 9,
  menuGroup: 'Website',
  tab: null,
  routes,
};
