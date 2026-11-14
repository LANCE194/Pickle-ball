import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.deployments',
  role: 'super-admin',
  featureKey: null,
  label: "Deployments",
  icon: 'rocket',
  path: 'deployments',
  order: 2,
  menuGroup: 'Website',
  tab: null,
  routes,
};
