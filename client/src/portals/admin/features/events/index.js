import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.events',
  role: 'admin',
  featureKey: 'events_announcements',
  label: "Events",
  icon: 'megaphone',
  path: 'events',
  order: 10,
  menuGroup: 'Club',
  tab: null,
  routes,
};
