import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'player.book-court',
  role: 'player',
  featureKey: null,
  label: "Book Court",
  icon: 'calendar-plus',
  path: 'book',
  order: 2,
  menuGroup: 'Main',
  tab: 2,
  routes,
};
