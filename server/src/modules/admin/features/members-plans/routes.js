const r = require('express').Router();
const c = require('./controller');
r.get('/plans', c.plans);
r.post('/plans', c.createPlan);
r.patch('/plans/:id', c.updatePlan);
r.get('/members', c.members);
r.post('/members', c.addMember);
r.post('/members/:playerId/renew', c.renew);
r.get('/players', c.players);
r.post('/players', c.addPlayer);
r.get('/players/:id', c.getPlayer);
r.patch('/players/:id', c.updatePlayer);
r.post('/players/:id/resend-invite', c.resend);
r.post('/players/:id/reset-password', c.resetPlayer);
r.post('/players/:id/verify-level', c.verify);
r.post('/players/:id/override-level', c.override); // admin only: needs a written note, logged in rating_history
r.post('/players/:id/archive', c.archive);
r.post('/players/:id/restore', c.restore);
module.exports = r;
