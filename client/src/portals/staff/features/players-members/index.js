import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.players-members',
  role: 'staff',
  featureKey: null,
  label: "Members",
  icon: 'users',
  path: 'members',
  order: 7,
  menuGroup: 'People',
  tab: 4,
  routes,
};
