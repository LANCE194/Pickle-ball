const r = require('express').Router();
const c = require('./controller');
const perm = require('../../../../middleware/requirePermission');
r.get('/', c.list);
r.post('/:id/scores', perm('matches_score'), c.scores);
module.exports = r;
