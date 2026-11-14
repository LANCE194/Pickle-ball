const { query } = require('../../config/db');
const { HttpError, cleanText } = require('../utils');
const list = async ({ onlyEnabled = false } = {}) => (await query(`SELECT id, provider, account_name, account_number, image_path, enabled, created_at FROM payment_qr_codes WHERE archived_at IS NULL AND ($1 = false OR enabled) ORDER BY provider, created_at`, [onlyEnabled])).rows;
function check(b, needImage, hasFile) {
  const e = {};
  if (!['gcash', 'maya', 'bank'].includes(b.provider)) e.provider = 'Choose GCash, Maya or Bank.';
  if (!b.account_name || !String(b.account_name).trim()) e.account_name = 'Type the name on the account.';
  if (!b.account_number || !String(b.account_number).trim()) e.account_number = 'Type the account or mobile number.';
  if (needImage && !hasFile) e.file = 'Choose the QR picture (JPG or PNG).';
  if (Object.keys(e).length) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: e });
}
async function create(b, file, userId) {
  check(b, true, !!file);
  return (await query('INSERT INTO payment_qr_codes (provider, account_name, account_number, image_path, uploaded_by, enabled) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [b.provider, cleanText(b.account_name, 80), cleanText(b.account_number, 60), file.path, userId, b.enabled !== 'false' && b.enabled !== false])).rows[0];
}
async function update(id, b, file, userId) {
  check(b, false, !!file);
  const { rows } = await query('UPDATE payment_qr_codes SET provider=$2, account_name=$3, account_number=$4, image_path=COALESCE($5, image_path), enabled=$6, uploaded_by=$7, updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING *', [id, b.provider, cleanText(b.account_name, 80), cleanText(b.account_number, 60), file ? file.path : null, b.enabled !== 'false' && b.enabled !== false, userId]);
  if (!rows[0]) throw new HttpError(404, 'We could not find that QR code.'); return rows[0];
}
const setEnabled = async (id, enabled) => (await query('UPDATE payment_qr_codes SET enabled=$2, updated_at=now() WHERE id=$1 RETURNING *', [id, enabled])).rows[0];
const archive = async id => { await query('UPDATE payment_qr_codes SET archived_at=now(), enabled=false WHERE id=$1', [id]); };
module.exports = { list, create, update, setEnabled, archive };
