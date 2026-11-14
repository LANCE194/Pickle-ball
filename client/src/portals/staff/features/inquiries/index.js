import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.inquiries',
  role: 'staff',
  featureKey: 'inquiries',
  label: "Inquiries",
  icon: 'mail',
  path: 'inquiries',
  order: 9,
  menuGroup: 'People',
  tab: null,
  routes,
};
