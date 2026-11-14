import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.events',
  role: 'player',
  featureKey: 'events_announcements',
  label: "Events",
  icon: 'megaphone',
  path: 'events',
  order: 6,
  menuGroup: 'Main',
  tab: 4,
  routes,
};
