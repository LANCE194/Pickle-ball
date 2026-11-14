const reports = require('../../../../shared/services/reports');
const membership = require('../../../../shared/services/membership');
const { HttpError } = require('../../../../shared/utils');
const ok = p => { if (!['daily', 'weekly', 'monthly'].includes(p)) throw new HttpError(404, 'Not found'); return p; };
exports.report = (p, d, clubId) => reports.report(ok(p), d, clubId);
exports.xlsx = async (p, d, clubId) => reports.toXlsx(await reports.report(ok(p), d, clubId));
exports.pdf = async (p, d, clubId) => reports.toPdf(await reports.report(ok(p), d, clubId));
exports.attendance = async (d, clubId) => reports.attendanceXlsx(await membership.attendance({ date: d || null, clubId }));
