const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.get('/partners', c.partners);
r.post('/entries/:entryId/withdraw', c.withdraw);
r.get('/:id', c.one);
r.post('/:id/register', c.register);
r.get('/:id/matches', c.matches);
module.exports = r;
