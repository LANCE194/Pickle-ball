const rateLimit = require('express-rate-limit');
const make = (windowMs, max, message) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message, code: 'RATE_LIMIT' } });
module.exports = {
  general: make(60 * 1000, 300, 'Too many requests. Please wait a moment and try again.'),
  login: make(15 * 60 * 1000, 30, 'Too many attempts. Please wait a few minutes and try again.'),
  otp: make(15 * 60 * 1000, 10, 'Too many codes requested. Please wait a few minutes.'),
  superAdmin: make(15 * 60 * 1000, 10, 'Too many attempts.'),
  inquiry: make(60 * 60 * 1000, 10, 'Too many messages. Please try again later.'),
};
