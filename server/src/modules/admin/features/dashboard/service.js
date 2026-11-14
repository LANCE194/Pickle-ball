const reports = require('../../../../shared/services/reports');
exports.get = req => reports.dashboard({ clubId: req.user.clubId }); // counters, revenue + utilization charts, pending items
