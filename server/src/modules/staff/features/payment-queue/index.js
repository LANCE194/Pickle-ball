// Manifest: how the server mounts this feature. featureKey null = core (always on).
module.exports = {
  key: 'staff.payment-queue',
  folder: 'payment-queue',
  featureKey: null,
  label: "Payment Queue",
  mountPath: '/api/staff/payment-queue',
  roles: ["staff"],
  order: 3,
  router: require('./routes'),
};
