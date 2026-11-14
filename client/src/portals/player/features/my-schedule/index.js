import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.my-schedule',
  role: 'player',
  featureKey: null,
  label: "My Schedule",
  icon: 'calendar',
  path: 'schedule',
  order: 3,
  menuGroup: 'Main',
  tab: 3,
  routes,
};
