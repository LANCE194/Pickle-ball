import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'coach-referee.score-entry',
  role: 'coach-referee',
  featureKey: 'tournaments',
  label: "Score Entry",
  icon: 'edit',
  path: 'scores',
  order: 2,
  menuGroup: 'Main',
  tab: 2,
  routes,
};
