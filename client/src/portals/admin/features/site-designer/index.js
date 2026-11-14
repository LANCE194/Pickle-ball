import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.site-designer',
  role: 'admin',
  featureKey: 'site_designer',
  label: "Site Designer",
  icon: 'palette',
  path: 'site-designer',
  order: 11,
  menuGroup: 'Website',
  tab: null,
  routes,
};
