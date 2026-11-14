const r = require('express').Router();
const c = require('./controller');
const validate = require('../../../../middleware/validate');
const v = require('./validator');
r.get('/slots', c.slots);
r.get('/quote', c.quote);
r.get('/last', c.last);
r.post('/', validate(v.book), c.book); // step 3: "Book this court"
module.exports = r;
