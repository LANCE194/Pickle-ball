const { query } = require('../../../../config/db');
const tz = require('../../../../config/timezone');
exports.list = async user => { const { rows } = await query(`SELECT * FROM notifications WHERE user_id=$1 AND kind<>'otp' ORDER BY created_at DESC LIMIT 100`, [user.id]); return { unread: rows.filter(r => !r.read_at).length, items: rows.map(r => ({ ...r, date_label: tz.formatDate(r.created_at), time_label: tz.formatTime(r.created_at) })) }; };
exports.read = async user => { await query('UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL', [user.id]); return { ok: true }; };
