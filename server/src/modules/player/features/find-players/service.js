const { query, tx } = require('../../../../config/db');
const tz = require('../../../../config/timezone');
const booking = require('../../../../shared/services/booking');
const notification = require('../../../../shared/services/notification');
const realtime = require('../../../../realtime/gateway');
const { HttpError, cleanText } = require('../../../../shared/utils');
const me = async uid => { const { rows } = await query(`SELECT * FROM players WHERE user_id=$1 AND archived_at IS NULL AND status IN ('active','pending_verification')`, [uid]); if (!rows[0]) throw new HttpError(403, 'Forbidden', 'FORBIDDEN'); return rows[0]; };
const VIEW = `SELECT o.*, h.first_name||' '||h.last_name AS host_name, h.user_id AS host_user, c.name AS court_name, c.court_number,
  (SELECT count(*)::int FROM open_play_members m WHERE m.post_id=o.id AND m.status='confirmed') AS confirmed_count,
  GREATEST(o.spots_needed - (SELECT count(*)::int FROM open_play_members m WHERE m.post_id=o.id AND m.status='confirmed'), 0) AS spots_left
  FROM open_play_posts o JOIN players h ON h.id=o.host_player_id LEFT JOIN courts c ON c.id=o.court_id`;
const decorate = (r, myId) => ({ ...r, date_label: tz.formatDate(r.starts_at), time_label: tz.formatRange(r.starts_at, r.ends_at), court_label: r.court_name ? `${r.court_name} (Court ${r.court_number})` : 'Court to be decided', is_host: r.host_player_id === myId, cost_label: r.cost_split ? `${tz.peso(r.cost_split)} each` : 'No cost split' });
exports.board = async ({ date, level }, user) => {
  const p = await me(user.id);
  const { rows } = await query(`${VIEW} WHERE o.status IN ('open','full') AND o.ends_at > now() AND ($1::date IS NULL OR (o.starts_at AT TIME ZONE 'Asia/Manila')::date=$1::date) AND ($2::numeric IS NULL OR (o.level_min <= $2::numeric AND o.level_max >= $2::numeric)) ORDER BY o.starts_at LIMIT 100`, [date || null, level || null]);
  const mine = await query(`SELECT post_id, status FROM open_play_members WHERE player_id=$1`, [p.id]); const st = new Map(mine.rows.map(m => [m.post_id, m.status]));
  const hostIds = rows.filter(r => r.host_player_id === p.id).map(r => r.id);
  const reqs = hostIds.length ? (await query(`SELECT m.post_id, m.player_id, m.needs_host_approval, pl.first_name||' '||pl.last_name AS name, pl.rating FROM open_play_members m JOIN players pl ON pl.id=m.player_id WHERE m.post_id = ANY($1) AND m.status='requested'`, [hostIds])).rows : [];
  return rows.map(r => ({ ...decorate(r, p.id), my_status: st.get(r.id) || null, in_my_level: Number(p.rating) >= Number(r.level_min) && Number(p.rating) <= Number(r.level_max), requests: reqs.filter(q => q.post_id === r.id) }));
};
exports.create = async (b, user) => {
  const p = await me(user.id); const start = tz.manilaToUtc(b.date, b.start_time); const end = new Date(start.getTime() + (Number(b.hours) || 2) * 3600000);
  if (start.getTime() <= Date.now()) throw Object.assign(new HttpError(422, 'Please fix the highlighted fields.', 'VALIDATION'), { fields: { date: 'Choose a time that has not passed.' } });
  const clash = await query(`SELECT 1 FROM bookings WHERE player_id=$1 AND status IN ('pending','confirmed') AND starts_at < $3 AND ends_at > $2 LIMIT 1`, [p.id, start, end]);
  if (clash.rows.length) throw new HttpError(409, 'You already have a booking at that time.');
  const { rows } = await query(`INSERT INTO open_play_posts (host_player_id, court_id, starts_at, ends_at, format, level_min, level_max, spots_needed, cost_split, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [p.id, b.court_id || null, start, end, b.format || 'doubles', b.level_min ?? Math.max(1, Number(p.rating) - 0.5), b.level_max ?? Math.min(6.5, Number(p.rating) + 0.5), b.spots_needed, b.cost_split || null, cleanText(b.notes, 300)]);
  await query(`INSERT INTO open_play_members (post_id, player_id, status) VALUES ($1,$2,'confirmed')`, [rows[0].id, p.id]); // the host holds one spot
  realtime.publish('role:player', 'openplay.changed', { id: rows[0].id }); return rows[0];
};
// Players with a similar rating and NO schedule conflict, for the host to invite.
exports.suggestions = async user => {
  const p = await me(user.id);
  const { rows } = await query(`SELECT o.id, o.starts_at, o.ends_at, o.level_min, o.level_max, c.name AS court_name, c.court_number FROM open_play_posts o LEFT JOIN courts c ON c.id=o.court_id WHERE o.host_player_id=$1 AND o.status IN ('open','full') AND o.ends_at > now() ORDER BY o.starts_at LIMIT 1`, [p.id]);
  const post = rows[0]; if (!post) return { post: null, players: [] };
  const sug = await query(`SELECT pl.id, pl.first_name||' '||pl.last_name AS name, pl.rating, pl.skill_level FROM players pl WHERE pl.id<>$1 AND pl.status='active' AND pl.archived_at IS NULL AND pl.rating BETWEEN $2 AND $3
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.player_id=pl.id AND b.status IN ('pending','confirmed') AND b.starts_at < $5 AND b.ends_at > $4)
    AND NOT EXISTS (SELECT 1 FROM open_play_members m JOIN open_play_posts o2 ON o2.id=m.post_id WHERE m.player_id=pl.id AND m.status='confirmed' AND o2.starts_at < $5 AND o2.ends_at > $4)
    ORDER BY abs(pl.rating - $6) LIMIT 10`, [p.id, post.level_min, post.level_max, post.starts_at, post.ends_at, p.rating]);
  return { post: decorate(post, p.id), players: sug.rows };
};
exports.join = async (id, user) => {
  const p = await me(user.id);
  const out = await tx(async db => {
    const { rows } = await db.query(`${VIEW} WHERE o.id=$1 FOR UPDATE OF o`, [id]); const o = rows[0];
    if (!o || !['open', 'full'].includes(o.status)) throw new HttpError(404, 'This game is no longer open.'); if (o.host_player_id === p.id) throw new HttpError(409, 'You are the host of this game.');
    const clash = await db.query(`SELECT 1 FROM bookings WHERE player_id=$1 AND status IN ('pending','confirmed') AND starts_at < $3 AND ends_at > $2 UNION ALL SELECT 1 FROM open_play_members m JOIN open_play_posts o2 ON o2.id=m.post_id WHERE m.player_id=$1 AND m.status='confirmed' AND o2.id<>$4 AND o2.starts_at < $3 AND o2.ends_at > $2 LIMIT 1`, [p.id, o.starts_at, o.ends_at, id]);
    if (clash.rows.length) throw new HttpError(409, 'You already have something at that time.', 'CONFLICT');
    const outside = Number(p.rating) < Number(o.level_min) || Number(p.rating) > Number(o.level_max); // outside level: the host must approve
    await db.query(`INSERT INTO open_play_members (post_id, player_id, status, needs_host_approval) VALUES ($1,$2,'requested',$3) ON CONFLICT (post_id, player_id) DO UPDATE SET status='requested', needs_host_approval=$3`, [id, p.id, outside]);
    return { o, outside };
  });
  await notification.notify(out.o.host_user, 'Someone wants to join your game', `${p.first_name} ${p.last_name} asked to join${out.outside ? ' (outside your level range)' : ''}. ${tz.formatDate(out.o.starts_at)}, ${tz.formatRange(out.o.starts_at, out.o.ends_at)}.`, 'openplay');
  return { ok: true, message: out.outside ? 'Request sent. This game is outside your level, so the host must approve it.' : 'Request sent. The host will confirm.' };
};
exports.decide = async (id, playerId, decision, user) => {
  const p = await me(user.id); if (!['confirm', 'decline'].includes(decision)) throw new HttpError(422, 'Choose confirm or decline.');
  const out = await tx(async db => {
    const { rows } = await db.query(`${VIEW} WHERE o.id=$1 FOR UPDATE OF o`, [id]); const o = rows[0]; if (!o || o.host_player_id !== p.id) throw new HttpError(404, 'We could not find that game.');
    if (decision === 'confirm') { if (o.spots_left <= 0) throw new HttpError(409, 'All spots are taken.'); await db.query(`UPDATE open_play_members SET status='confirmed' WHERE post_id=$1 AND player_id=$2 AND status='requested'`, [id, playerId]); if (o.spots_left - 1 <= 0) await db.query(`UPDATE open_play_posts SET status='full' WHERE id=$1`, [id]); }
    else await db.query(`UPDATE open_play_members SET status='declined' WHERE post_id=$1 AND player_id=$2`, [id, playerId]);
    return o;
  });
  const { rows: u } = await query('SELECT user_id FROM players WHERE id=$1', [playerId]);
  if (u[0]) await notification.notify(u[0].user_id, decision === 'confirm' ? 'You are in' : 'Request declined', `${decision === 'confirm' ? 'The host confirmed your spot.' : 'The host could not fit you in.'} ${tz.formatDate(out.starts_at)}, ${tz.formatRange(out.starts_at, out.ends_at)}.`, 'openplay');
  realtime.publish('role:player', 'openplay.changed', { id }); return { ok: true };
};
exports.leave = async (id, user) => {
  const p = await me(user.id); const { rows } = await query(`UPDATE open_play_members SET status='left' WHERE post_id=$1 AND player_id=$2 AND status IN ('requested','confirmed') RETURNING status`, [id, p.id]); if (!rows[0]) throw new HttpError(404, 'You are not in this game.');
  await query(`UPDATE open_play_posts SET status='open' WHERE id=$1 AND status='full'`, [id]);
  const o = (await query(`${VIEW} WHERE o.id=$1`, [id])).rows[0]; if (o) await notification.notify(o.host_user, 'A player left your game', `${p.first_name} ${p.last_name} left.`, 'openplay');
  realtime.publish('role:player', 'openplay.changed', { id }); return { ok: true, message: 'You left the game.' };
};
// The host can turn a post into a real court booking (the court must be chosen).
exports.book = async (id, user) => {
  const p = await me(user.id); const o = (await query(`${VIEW} WHERE o.id=$1`, [id])).rows[0]; if (!o || o.host_player_id !== p.id) throw new HttpError(404, 'We could not find that game.');
  if (!o.court_id) throw new HttpError(422, 'Choose a court for this game first.');
  const hours = Math.round((new Date(o.ends_at) - new Date(o.starts_at)) / 3600000);
  const r = await booking.create({ courtId: o.court_id, playerId: p.id, startsAt: new Date(o.starts_at), hours, playersCount: o.confirmed_count, bookedBy: user.id, openPlayPostId: id });
  return { booking: booking.present({ ...r.booking, court_name: r.court.name, court_number: r.court.court_number }), message: 'Court held for your game. Send payment proof to confirm.' };
};
exports.cancel = async (id, user) => { const p = await me(user.id); const { rows } = await query(`UPDATE open_play_posts SET status='cancelled' WHERE id=$1 AND host_player_id=$2 AND status IN ('open','full') RETURNING id`, [id, p.id]); if (!rows[0]) throw new HttpError(404, 'We could not find that game.'); realtime.publish('role:player', 'openplay.changed', { id }); return { ok: true }; };
