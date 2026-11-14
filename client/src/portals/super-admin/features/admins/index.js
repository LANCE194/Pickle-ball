import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'super-admin.admins',
  role: 'super-admin',
  featureKey: null,
  label: "Admins",
  icon: 'users',
  path: 'admins',
  order: 1,
  menuGroup: 'People',
  tab: null,
  routes,
};
