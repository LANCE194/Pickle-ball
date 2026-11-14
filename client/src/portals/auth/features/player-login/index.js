import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'auth.player-login',
  role: 'auth',
  featureKey: null,
  label: "Player login",
  icon: 'login',
  path: 'player-login',
  order: 1,
  menuGroup: 'Auth',
  tab: null,
  routes,
};
