import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.dashboard',
  role: 'admin',
  featureKey: 'reports_dashboards',
  label: "Dashboard",
  icon: 'home',
  path: 'dashboard',
  order: 1,
  menuGroup: 'Main',
  tab: 1,
  routes,
};
