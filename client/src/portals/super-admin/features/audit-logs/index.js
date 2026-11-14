import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.audit-logs',
  role: 'super-admin',
  featureKey: null,
  label: "Audit Logs",
  icon: 'scroll',
  path: 'audit-logs',
  order: 5,
  menuGroup: 'System',
  tab: null,
  routes,
};
