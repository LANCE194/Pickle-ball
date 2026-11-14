const { query } = require('../../config/db');
const tz = require('../../config/timezone');
const { HttpError } = require('../utils');
const upload = require('../../middleware/upload');
/** Payment queue rows: thumbnail, amount, player, booking (date, time, court). Proof images load only through the authenticated /api/files route. */
async function list({ status = 'pending_verification', q = '' } = {}) {
  const sts = status === 'open' ? ['pending_verification', 'pay_at_court_pending'] : status ? [status] : null;
  const { rows } = await query(`SELECT pay.*, p.first_name||' '||p.last_name AS player_name, b.starts_at, b.ends_at, c.name AS court_name, c.court_number, t.name AS tournament_name, mp.name AS plan_name
    FROM payments pay LEFT JOIN players p ON p.id=pay.player_id LEFT JOIN bookings b ON b.id=pay.booking_id LEFT JOIN courts c ON c.id=b.court_id
    LEFT JOIN tournament_entries te ON te.id=pay.tournament_entry_id LEFT JOIN tournaments t ON t.id=te.tournament_id LEFT JOIN memberships ms ON ms.id=pay.membership_id LEFT JOIN membership_plans mp ON mp.id=ms.plan_id
    WHERE ($1::text[] IS NULL OR pay.status::text = ANY($1)) AND ($2='' OR lower(coalesce(p.first_name||' '||p.last_name,'')||' '||pay.reference_code) LIKE '%'||lower($2)||'%') ORDER BY pay.created_at DESC LIMIT 200`, [sts, q]);
  return rows.map(r => ({ id: r.id, status: r.status, amount: r.amount, amount_label: tz.peso(r.amount), reference_code: r.reference_code, proof_reference_no: r.proof_reference_no, reject_reason: r.reject_reason, player_name: r.player_name || 'Guest',
    for: r.starts_at ? 'Court booking' : r.tournament_name ? `Tournament: ${r.tournament_name}` : r.plan_name ? `Membership: ${r.plan_name}` : 'Payment',
    schedule_line: r.starts_at ? tz.scheduleLine(r.starts_at, r.ends_at, { name: r.court_name, court_number: r.court_number }) : null, proof_url: r.proof_path ? `/api/files/${r.proof_path}` : null, created_at: r.created_at,
    created_label: `${tz.formatDate(r.created_at)}, ${tz.formatTime(r.created_at)}` }));
}
async function proofFile(id) { const { rows } = await query('SELECT proof_path FROM payments WHERE id=$1', [id]); if (!rows[0] || !rows[0].proof_path) throw new HttpError(404, 'There is no proof for this payment.'); return upload.absolute(rows[0].proof_path); }
module.exports = { list, proofFile };
