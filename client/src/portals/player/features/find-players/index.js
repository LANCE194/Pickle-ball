import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.find-players',
  role: 'player',
  featureKey: 'open_play',
  label: "Find Players",
  icon: 'search',
  path: 'find-players',
  order: 4,
  menuGroup: 'Main',
  tab: null,
  routes,
};
