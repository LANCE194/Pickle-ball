const r = require('express').Router();
const c = require('./controller');
r.get('/attendance.xlsx', c.attendance);
r.get('/:period', c.report);
r.get('/:period/export.xlsx', c.xlsx);
r.get('/:period/export.pdf', c.pdf);
module.exports = r;
