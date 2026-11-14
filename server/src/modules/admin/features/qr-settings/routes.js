const r = require('express').Router();
const c = require('./controller');
const upload = require('../../../../middleware/upload');
r.get('/', c.list);
r.post('/', ...upload('qr'), c.create);                              // upload (JPG/PNG, 5 MB, checked by file signature)
r.patch('/:id', ...upload('qr', 'file', { required: false }), c.update); // replace image optional
r.post('/:id/toggle', c.toggle);
r.delete('/:id', c.remove);
module.exports = r;
