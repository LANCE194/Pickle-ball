import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.courts',
  role: 'staff',
  featureKey: null,
  label: "Courts",
  icon: 'grid',
  path: 'courts',
  order: 4,
  menuGroup: 'Club',
  tab: null,
  routes,
};
