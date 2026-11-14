// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'admin.members-plans',
  folder: 'members-plans',
  featureKey: 'memberships',
  label: "Members and Plans",
  mountPath: '/api/admin/members-plans',
  roles: ["admin","super_admin"],
  order: 6,
  router: require('./routes'),
};
