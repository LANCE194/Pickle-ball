const { query } = require('../../config/db');
const { HttpError, cleanText, isEmail, normalizeMobile } = require('../utils');
const notification = require('./notification');
async function submit(b) {
  const e = {};
  if (!b.name || cleanText(b.name, 80).length < 2) e.name = 'Please tell us your name.';
  if (!b.contact || !(isEmail(b.contact) || normalizeMobile(b.contact))) e.contact = 'Add a mobile number like 0917 123 4567 or an email.';
  if (!['booking', 'tournament', 'membership', 'other'].includes(b.interest)) e.interest = 'Choose what you are interested in.';
  if (b.consent !== true) e.consent = 'Please tick the box so we can use your details to reply.';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
  const { rows } = await query('INSERT INTO inquiries (name, age_range, contact, interest, message, consent) VALUES ($1,$2,$3,$4,$5,true) RETURNING id', [cleanText(b.name, 80), cleanText(b.age_range, 20), cleanText(b.contact, 120), b.interest, cleanText(b.message, 1500)]);
  await notification.notifyRoles(['admin', 'staff'], 'New message from the website', `${cleanText(b.name, 80)} asked about ${b.interest}.`, 'inquiry');
  return rows[0];
}
const list = async ({ handled = null } = {}) => (await query('SELECT * FROM inquiries WHERE ($1::boolean IS NULL OR handled=$1::boolean) ORDER BY created_at DESC LIMIT 200', [handled])).rows;
const markHandled = async (id, userId, handled = true) => (await query('UPDATE inquiries SET handled=$2, handled_by=$3 WHERE id=$1 RETURNING *', [id, handled, userId])).rows[0];
module.exports = { submit, list, markHandled };
