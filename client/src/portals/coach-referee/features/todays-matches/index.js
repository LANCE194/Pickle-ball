import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'coach-referee.todays-matches',
  role: 'coach-referee',
  featureKey: 'tournaments',
  label: "Today's Matches",
  icon: 'calendar',
  path: 'today',
  order: 1,
  menuGroup: 'Main',
  tab: 1,
  routes,
};
