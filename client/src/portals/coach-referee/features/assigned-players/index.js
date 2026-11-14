import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'coach-referee.assigned-players',
  role: 'coach-referee',
  featureKey: 'player_profiles_skill',
  label: "Players",
  icon: 'users',
  path: 'players',
  order: 3,
  menuGroup: 'Main',
  tab: 3,
  routes,
};
