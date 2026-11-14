const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const randomToken = (n = 32) => crypto.randomBytes(n).toString('hex');
/** 12+ char temporary password, no look-alike characters. */
function tempPassword(len = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = ''; const b = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += chars[b[i] % chars.length];
  return out;
}
const otpCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const referenceCode = () => 'DN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const cleanText = (s, max = 2000) => sanitizeHtml(String(s ?? ''), { allowedTags: [], allowedAttributes: {} }).trim().slice(0, max);
const passwordProblem = pw => {
  if (typeof pw !== 'string' || pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number.';
  return null;
};
// PH mobile: 09XXXXXXXXX or +639XXXXXXXXX -> stored as 09XXXXXXXXX
function normalizeMobile(v) {
  if (!v) return null; const d = String(v).replace(/[\s-]/g, '');
  if (/^\+639\d{9}$/.test(d)) return '0' + d.slice(3);
  if (/^639\d{9}$/.test(d)) return '0' + d.slice(2);
  if (/^09\d{9}$/.test(d)) return d;
  return null;
}
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
const isName = v => /^[\p{L}][\p{L} .'-]{0,59}$/u.test(String(v || '').trim());
function ageFromBirthdate(b) {
  if (!b) return null; const d = new Date(b), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
const maskTail = (v, keep = 3) => (v ? '*'.repeat(Math.max(0, String(v).length - keep)) + String(v).slice(-keep) : v);
/** Wrap async route handlers so errors reach the error middleware. */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
class HttpError extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code; } }
module.exports = { sha256, randomToken, tempPassword, otpCode, referenceCode, cleanText, passwordProblem, normalizeMobile, isEmail, isName, ageFromBirthdate, maskTail, wrap, HttpError };
