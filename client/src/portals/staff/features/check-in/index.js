import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.check-in',
  role: 'staff',
  featureKey: 'checkin_attendance',
  label: "Check-in",
  icon: 'check',
  path: 'check-in',
  order: 5,
  menuGroup: 'Main',
  tab: null,
  routes,
};
