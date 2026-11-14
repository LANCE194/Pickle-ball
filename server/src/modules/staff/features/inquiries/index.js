// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.inquiries',
  folder: 'inquiries',
  featureKey: 'inquiries',
  label: "Inquiries",
  mountPath: '/api/staff/inquiries',
  roles: ["staff"],
  order: 9,
  router: require('./routes'),
};
