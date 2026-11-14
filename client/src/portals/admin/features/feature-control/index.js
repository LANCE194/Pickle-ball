import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.feature-control',
  role: 'admin',
  featureKey: null,
  label: "Feature Control",
  icon: 'toggle',
  path: 'feature-control',
  order: 12,
  menuGroup: 'Club',
  tab: null,
  routes,
};
