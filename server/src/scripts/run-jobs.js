// Run background jobs once (for cron): node server/src/scripts/run-jobs.js
const booking = require('../shared/services/booking'); const membership = require('../shared/services/membership');
(async () => { console.log('expired bookings:', await booking.expirePending()); console.log('membership reminders sent:', await membership.sendReminders()); console.log('booking reminders sent:', await booking.sendReminders()); })().catch(e => { console.error(e.message); process.exit(1); });
