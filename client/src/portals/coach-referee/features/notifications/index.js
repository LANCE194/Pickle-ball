import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'coach-referee.notifications',
  role: 'coach-referee',
  featureKey: null,
  label: "Notifications",
  icon: 'bell',
  path: 'notifications',
  order: 5,
  menuGroup: 'Me',
  tab: null,
  routes,
};
