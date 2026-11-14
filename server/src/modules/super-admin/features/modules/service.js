// Reads the registry the loader filled while mounting every role folder and feature folder.
exports.list = async () => require('../../../loader').registry.map(m => ({ role: m.role, folder: m.folder, label: m.label, feature_key: m.featureKey, mount: m.mount }));
