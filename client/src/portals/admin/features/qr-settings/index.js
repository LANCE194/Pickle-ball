import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.qr-settings',
  role: 'admin',
  featureKey: 'qr_payments',
  label: "QR Settings",
  icon: 'qr',
  path: 'qr-settings',
  order: 8,
  menuGroup: 'Club',
  tab: null,
  routes,
};
