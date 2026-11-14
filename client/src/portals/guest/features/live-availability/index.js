import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'guest.live-availability',
  role: 'guest',
  featureKey: 'guest_portal',
  label: "Schedule",
  icon: 'calendar',
  path: 'schedule',
  order: 3,
  menuGroup: 'Public',
  tab: null,
  routes,
};
