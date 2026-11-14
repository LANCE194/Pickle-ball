const booking = require('../../../../shared/services/booking');
const tz = require('../../../../config/timezone');
// Read-only slot colours for guests: no names, no payments, no booking ids.
exports.grid = async ({ date, court }) => { const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : tz.manilaDate(new Date()); return { date: d, courts: await booking.slotGrid(d, court || null) }; };
