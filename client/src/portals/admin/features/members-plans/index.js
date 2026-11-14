import routes from './routes';
// Manifest: the portal menu, router and bottom tab bar are built from this (never hard-coded in a layout).
export default {
  key: 'admin.members-plans',
  role: 'admin',
  featureKey: 'memberships',
  label: "Members and Plans",
  icon: 'badge',
  path: 'members',
  order: 6,
  menuGroup: 'People',
  tab: 4,
  routes,
};
