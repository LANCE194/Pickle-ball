// WebSocket gateway with role-scoped channels. Each browser tab opens its own connection with its own token (rule D).
// Channels: public:availability | role:<role> | user:<id> | session:<id> | global:features
const { WebSocketServer } = require('ws');
const { query } = require('../config/db');
const { sha256 } = require('../shared/utils');
const { normalizeHost, resolveClubFromHost } = require('../shared/services/tenant');
let wss = null; let version = 0;
const clients = new Set(); // { ws, channels:Set, user }
function publish(channel, event, data = {}) {
  const msg = JSON.stringify({ channel, event, data, v: ++version, at: new Date().toISOString() });
  for (const c of clients) if (c.channels.has(channel) && c.ws.readyState === 1) c.ws.send(msg);
}
function canSubscribe(user, channel) {
  if (channel === 'public:availability' || channel === 'global:features') return true;
  if (!user) return false;
  if (channel === `user:${user.id}` || channel === `session:${user.sessionId}`) return true;
  if (channel === `role:${user.role}`) return true;
  if (channel === 'staffside' && ['admin', 'staff', 'super_admin'].includes(user.role)) return true;
  if (channel === 'scores' && ['admin', 'staff', 'coach_referee', 'player', 'super_admin'].includes(user.role)) return true;
  return false;
}
async function resolveUser(token, clubId) {
  if (!token) return null;
  const { rows } = await query(`SELECT s.id AS sid, u.id, u.role, u.status FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.club_id=$2 AND s.revoked_at IS NULL AND (u.role='super_admin' OR u.club_id=$2)`, [sha256(token), clubId]);
  return rows[0] && rows[0].status === 'active' ? { id: rows[0].id, role: rows[0].role, sessionId: rows[0].sid } : null;
}
function rejectUpgrade(socket, status = 403) {
  if (socket.destroyed) return;
  const message = status === 403 ? 'Forbidden' : 'Service Unavailable';
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}
function attach(server) {
  wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return rejectUpgrade(socket); }
    if (url.pathname !== '/ws') return;
    const host = normalizeHost(req.headers.host || '');
    if (!host) return rejectUpgrade(socket);
    resolveClubFromHost(host).then(club => {
      if (!club) return rejectUpgrade(socket);
      wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req, club));
    }, error => {
      console.error('WebSocket tenant resolution failed:', error);
      rejectUpgrade(socket, 503);
    });
  });
  wss.on('connection', async (ws, req, club) => {
    const url = new URL(req.url, 'http://x');
    const user = await resolveUser(url.searchParams.get('token'), club.id).catch(error => {
      console.error('WebSocket authentication failed:', error);
      return null;
    });
    const c = { ws, user, channels: new Set(['public:availability', 'global:features']) };
    if (user) { c.channels.add(`user:${user.id}`); c.channels.add(`session:${user.sessionId}`); c.channels.add(`role:${user.role}`); if (['admin', 'staff', 'super_admin'].includes(user.role)) c.channels.add('staffside'); c.channels.add('scores'); }
    clients.add(c);
    ws.send(JSON.stringify({ event: 'hello', data: { authenticated: !!user }, v: version }));
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'subscribe' && canSubscribe(user, m.channel)) c.channels.add(m.channel); // access is checked on every subscription
      if (m.type === 'ping') ws.send(JSON.stringify({ event: 'pong', at: new Date().toISOString() }));
    });
    ws.on('close', () => clients.delete(c));
  });
  // feature changes can also switch realtime off; polling endpoints exist for the UI fallback
}
module.exports = { attach, publish };
