import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.player-login-activation',
  role: 'guest',
  featureKey: null,
  label: "Player Login",
  icon: 'login',
  path: 'login',
  order: 7,
  menuGroup: 'Public',
  tab: null,
  routes,
};
