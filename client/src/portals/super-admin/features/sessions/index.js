import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.sessions',
  role: 'super-admin',
  featureKey: null,
  label: "Sessions",
  icon: 'monitor',
  path: 'sessions',
  order: 6,
  menuGroup: 'System',
  tab: null,
  routes,
};
