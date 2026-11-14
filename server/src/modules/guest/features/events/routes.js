const r = require('express').Router();
const c = require('./controller');
const requireFeature = require('../../../../middleware/requireFeature');
r.get('/', requireFeature('events_announcements'), c.list);
module.exports = r;
