const r = require('express').Router();
const c = require('./controller');
const upload = require('../../../../middleware/upload');
r.get('/', c.get);
r.patch('/', c.update);
r.post('/photo', ...upload('profiles'), c.photo);
r.get('/history', c.history);
module.exports = r;
