import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.staff-management',
  role: 'admin',
  featureKey: null,
  label: "Staff",
  icon: 'user-cog',
  path: 'staff',
  order: 7,
  menuGroup: 'People',
  tab: null,
  routes,
};
