import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.membership',
  role: 'player',
  featureKey: 'memberships',
  label: "Membership",
  icon: 'badge',
  path: 'membership',
  order: 10,
  menuGroup: 'Me',
  tab: null,
  routes,
};
