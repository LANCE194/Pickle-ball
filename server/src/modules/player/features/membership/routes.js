const r = require('express').Router();
const c = require('./controller');
r.get('/', c.mine);
r.get('/plans', c.plans);
r.post('/join', c.join);
module.exports = r;
