import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.reports',
  role: 'admin',
  featureKey: 'reports_dashboards',
  label: "Reports",
  icon: 'chart',
  path: 'reports',
  order: 9,
  menuGroup: 'Club',
  tab: null,
  routes,
};
