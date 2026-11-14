import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'auth.super-admin-login',
  role: 'auth',
  featureKey: null,
  label: "Super Admin login",
  icon: 'shield',
  path: 'private',
  order: 4,
  menuGroup: 'Auth',
  tab: null,
  routes,
};
