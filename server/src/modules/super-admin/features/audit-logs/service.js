const { query } = require('../../../../config/db');
const tz = require('../../../../config/timezone');
exports.list = async ({ q = '', role = '', action = '', limit = 200 }) => (await query(`SELECT * FROM audit_logs WHERE ($1='' OR action ILIKE '%'||$1||'%' OR entity ILIKE '%'||$1||'%' OR entity_id=$1) AND ($2='' OR role=$2) AND ($3='' OR action ILIKE $3||'%') ORDER BY id DESC LIMIT $4`, [q, role, action, Math.min(Number(limit) || 200, 500)])).rows.map(r => ({ ...r, date_label: tz.formatDate(r.created_at), time_label: tz.formatTime(r.created_at) }));
