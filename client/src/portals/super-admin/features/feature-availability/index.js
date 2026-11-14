import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.feature-availability',
  role: 'super-admin',
  featureKey: null,
  label: "Features",
  icon: 'toggle',
  path: 'features',
  order: 3,
  menuGroup: 'Club',
  tab: null,
  routes,
};
