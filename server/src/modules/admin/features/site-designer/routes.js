const r = require('express').Router();
const c = require('./controller');
const upload = require('../../../../middleware/upload');
r.get('/clubs', c.clubs);
r.get('/clubs/:id/preview-data', c.previewData);
r.get('/options', c.options);
r.get('/draft', c.getDraft);
r.put('/draft', c.saveDraft);      // autosave
r.delete('/draft', c.discard);
r.post('/submit', c.submit);       // "Submit for deployment": the Admin can NEVER make a draft live
r.post('/publish', c.publish);
r.get('/history', c.history);
r.post('/preview', c.preview);
r.get('/preview/:token', c.previewGet);
r.get('/media', c.media);
r.post('/media', ...upload('media'), c.addMedia);
module.exports = r;
