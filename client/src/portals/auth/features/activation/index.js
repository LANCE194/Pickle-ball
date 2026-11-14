import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'auth.activation',
  role: 'auth',
  featureKey: null,
  label: "Activation",
  icon: 'key',
  path: 'activate',
  order: 2,
  menuGroup: 'Auth',
  tab: null,
  routes,
};
