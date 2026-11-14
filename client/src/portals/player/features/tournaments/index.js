import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.tournaments',
  role: 'player',
  featureKey: 'tournaments',
  label: "Tournaments",
  icon: 'trophy',
  path: 'tournaments',
  order: 5,
  menuGroup: 'Main',
  tab: null,
  routes,
};
