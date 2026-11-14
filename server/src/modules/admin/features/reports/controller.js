const s = require('./service');
const { wrap } = require('../../../../shared/utils');
exports.report = wrap(async (req, res) => res.json(await s.report(req.params.period, req.query.date, req.user.clubId)));
exports.xlsx = wrap(async (req, res) => { res.set('Content-Disposition', `attachment; filename="dinknest-${req.params.period}.xlsx"`).type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(Buffer.from(await s.xlsx(req.params.period, req.query.date, req.user.clubId))); });
exports.pdf = wrap(async (req, res) => { res.set('Content-Disposition', `attachment; filename="dinknest-${req.params.period}.pdf"`).type('application/pdf').send(await s.pdf(req.params.period, req.query.date, req.user.clubId)); });
exports.attendance = wrap(async (req, res) => { res.set('Content-Disposition', 'attachment; filename="dinknest-attendance.xlsx"').type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(Buffer.from(await s.attendance(req.query.date, req.user.clubId))); });
