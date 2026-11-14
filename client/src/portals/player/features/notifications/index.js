import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.notifications',
  role: 'player',
  featureKey: null,
  label: "Notifications",
  icon: 'bell',
  path: 'notifications',
  order: 9,
  menuGroup: 'Me',
  tab: null,
  routes,
};
