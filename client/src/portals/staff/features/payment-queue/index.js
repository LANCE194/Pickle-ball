import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'staff.payment-queue',
  role: 'staff',
  featureKey: null,
  label: "Payment Queue",
  icon: 'wallet',
  path: 'payment-queue',
  order: 3,
  menuGroup: 'Main',
  tab: 3,
  routes,
};
