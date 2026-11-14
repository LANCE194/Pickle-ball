const { query } = require('../../../../config/db');
const tz = require('../../../../config/timezone');

exports.get = async () => {
  const today = tz.manilaDate(new Date());
  const from = tz.manilaToUtc(tz.manilaDate(new Date(tz.manilaToUtc(today, '00:00').getTime() - 13 * 86400000)), '00:00');
  const to = tz.manilaToUtc(tz.manilaDate(new Date(tz.manilaToUtc(today, '00:00').getTime() + 86400000)), '00:00');
  const stats = (await query(`SELECT
    (SELECT count(*)::int FROM clubs WHERE status='active') AS active_clubs,
    (SELECT count(*)::int FROM clubs) AS total_clubs,
    (SELECT count(*)::int FROM users WHERE role='admin' AND status='active') AS active_admins,
    (SELECT count(*)::int FROM users WHERE role IN ('admin','staff','coach_referee','player') AND status='active') AS active_users,
    (SELECT count(*)::int FROM bookings WHERE status IN ('pending','confirmed','completed') AND starts_at >= $1 AND starts_at < $2) AS bookings_14d`,
  [from, to])).rows[0];
  const { rows } = await query(`SELECT (starts_at AT TIME ZONE 'Asia/Manila')::date AS d, count(*)::int AS bookings
    FROM bookings WHERE status IN ('pending','confirmed','completed') AND starts_at >= $1 AND starts_at < $2
    GROUP BY 1 ORDER BY 1`, [from, to]);
  return {
    ...stats,
    bookings_chart: rows.map(row => ({ date: String(row.d).slice(0, 10), bookings: row.bookings })),
  };
};
