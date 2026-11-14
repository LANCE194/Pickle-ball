const r = require('express').Router();
const c = require('./controller');
r.get('/', c.list);
r.get('/requests', c.requests);
r.post('/requests', c.request);
r.get('/wizard', c.wizard);
r.post('/wizard', c.applyWizard);
r.post('/:key', c.toggle);
module.exports = r;
