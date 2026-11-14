const r = require('express').Router();
const c = require('./controller');
r.get('/users', c.users);
r.get('/conversations', c.conversations);
r.post('/conversations', c.createConversation);
r.get('/conversations/:id/messages', c.messages);
r.post('/conversations/:id/messages', c.sendMessage);
r.get('/attachments/:id', c.attachment);
module.exports = r;
