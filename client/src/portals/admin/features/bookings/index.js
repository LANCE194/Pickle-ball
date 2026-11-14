import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.bookings',
  role: 'admin',
  featureKey: null,
  label: "Bookings",
  icon: 'calendar',
  path: 'bookings',
  order: 2,
  menuGroup: 'Main',
  tab: 2,
  routes,
};
