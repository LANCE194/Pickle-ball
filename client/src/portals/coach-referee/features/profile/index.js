import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'coach-referee.profile',
  role: 'coach-referee',
  featureKey: null,
  label: "Profile",
  icon: 'user',
  path: 'profile',
  order: 4,
  menuGroup: 'Me',
  tab: 4,
  routes,
};
