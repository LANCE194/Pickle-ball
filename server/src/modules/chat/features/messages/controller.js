const s = require('./service');
const { wrap } = require('../../../../shared/utils');
const backupTransfer = require('../../../../shared/services/backupTransfer');
exports.users = wrap(async (req, res) => res.json(await s.searchUsers(req.user, req.query.search)));
exports.conversations = wrap(async (req, res) => res.json(await s.listConversations(req.user.id)));
exports.createConversation = wrap(async (req, res) => res.status(201).json(await s.createConversation(req.user, req.body.userId)));
exports.messages = wrap(async (req, res) => res.json(await s.listMessages(req.user.id, req.params.id)));
exports.sendMessage = wrap(async (req, res) => res.status(201).json(await s.sendMessage(req, req.params.id, req.body.body)));
exports.attachment = wrap(async (req, res) => { const file = await backupTransfer.attachmentFile(req.user.id, req.params.id); res.download(file.file, file.name); });
