const fd = require('../../../../shared/services/frontdesk');
const booking = require('../../../../shared/services/booking');
const tz = require('../../../../config/timezone');
exports.list = fd.list;
exports.slots = async ({ date, court }) => { const d = date || tz.manilaDate(new Date()); return { date: d, courts: await booking.slotGrid(d, court || null) }; };
exports.walkIn = fd.walkIn;
exports.recurring = fd.recurring;
exports.move = (id, b) => booking.move(id, { courtId: b.court_id, startsAt: new Date(b.start) }).then(() => ({ ok: true, message: 'Booking moved.' }));
exports.cancel = async (id, b, user) => { await booking.cancel(id, user, b.reason); return { ok: true, message: 'Booking cancelled.' }; };
