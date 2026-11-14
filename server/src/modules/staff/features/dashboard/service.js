const reports = require('../../../../shared/services/reports');
exports.get = req => reports.dashboard({ todayOnly: true, clubId: req.user.clubId }); // staff: today's schedule and payment queue counters only, no revenue
