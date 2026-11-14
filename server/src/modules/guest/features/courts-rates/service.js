const courts = require('../../../../shared/services/courts');
const tz = require('../../../../config/timezone');
exports.list = async () => (await courts.list({ publicOnly: true })).map(c => ({ ...c, label: `${c.name} (Court ${c.court_number})`, offpeak_label: tz.peso(c.offpeak_rate), peak_label: tz.peso(c.peak_rate) }));
