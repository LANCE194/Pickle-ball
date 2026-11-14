import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'auth.team-access',
  role: 'auth',
  featureKey: null,
  label: "Team access",
  icon: 'lock',
  path: 'team-access',
  order: 3,
  menuGroup: 'Auth',
  tab: null,
  routes,
};
