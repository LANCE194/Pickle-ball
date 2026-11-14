const { query } = require('../../../../config/db');
const tz = require('../../../../config/timezone');
const booking = require('../../../../shared/services/booking');
const { DEFAULT_CLUB_ID } = require('../../../../shared/services/tenant');
// Every row carries Date, Time and Court name/number (rule E).
exports.list = async (user, { when = 'upcoming' }) => {
  await booking.expirePending();
  const { rows } = await query(`${booking.SELECT_VIEW} WHERE p.user_id=$1 AND ${when === 'past' ? 'b.starts_at <= now()' : 'b.starts_at > now() - interval \'1 hour\' AND b.status IN (\'pending\',\'confirmed\')'} ORDER BY b.starts_at ${when === 'past' ? 'DESC' : ''} LIMIT 100`, [user.id]);
  return rows.map(booking.present);
};
exports.activity = async (user, clubId = user.clubId || DEFAULT_CLUB_ID) => {
  const today = tz.manilaDate(new Date());
  const dayStart = tz.manilaToUtc(today, '00:00');
  const from = new Date(dayStart.getTime() - 13 * 86400000);
  const to = new Date(dayStart.getTime() + 86400000);
  const { rows } = await query(`SELECT (b.starts_at AT TIME ZONE 'Asia/Manila')::date AS d, count(*)::int AS bookings
    FROM bookings b JOIN players p ON p.id=b.player_id AND p.club_id=b.club_id
    WHERE p.user_id=$1 AND p.club_id=$2 AND b.club_id=$2
      AND b.status IN ('pending','confirmed','completed') AND b.starts_at >= $3 AND b.starts_at < $4
    GROUP BY 1 ORDER BY 1`, [user.id, clubId, from, to]);
  return rows.map(row => ({ date: String(row.d).slice(0, 10), bookings: row.bookings }));
};
exports.cancel = async (id, user) => { await booking.cancel(id, user); return { ok: true, message: 'Your booking was cancelled.' }; };
