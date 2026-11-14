import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.my-profile-level',
  role: 'player',
  featureKey: null,
  label: "My Profile and Level",
  icon: 'user',
  path: 'profile',
  order: 7,
  menuGroup: 'Me',
  tab: 5,
  routes,
};
