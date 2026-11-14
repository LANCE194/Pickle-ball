import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.matches-scores',
  role: 'staff',
  featureKey: 'tournaments',
  label: "Matches",
  icon: 'trophy',
  path: 'matches',
  order: 6,
  menuGroup: 'Main',
  tab: null,
  routes,
};
