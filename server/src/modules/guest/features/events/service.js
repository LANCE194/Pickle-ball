const events = require('../../../../shared/services/events');
exports.list = () => events.list('guest'); // guests see Public events only
