// One WebSocket per TAB, using that tab's own token. Auto-reconnect with backoff; screens fall back to polling (see useApi).
import { getToken } from './api';
let ws = null, retry = 0, timer = null, status = 'reconnecting', lastAt = null, enabled = true;
const handlers = new Set(), statusHandlers = new Set(); const seen = new Map();
const setStatus = s => { status = s; statusHandlers.forEach(f => f({ status, lastAt })); };
function open() {
  if (!enabled) return; clearTimeout(timer);
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'; const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws') : `${proto}://${location.host}`;
  try { ws = new WebSocket(`${base}/ws?token=${encodeURIComponent(getToken() || '')}`); } catch { return schedule(); }
  ws.onopen = () => { retry = 0; lastAt = new Date(); setStatus('live'); handlers.forEach(h => h({ event: 'reconnected', data: {} })); };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } lastAt = new Date();
    if (m.v !== undefined && m.channel) { const k = m.channel + m.event; if ((seen.get(k) || 0) >= m.v) return; seen.set(k, m.v); } // version numbers: duplicates are ignored
    setStatus('live'); handlers.forEach(h => h(m)); };
  ws.onclose = () => { setStatus('reconnecting'); schedule(); }; ws.onerror = () => ws && ws.close();
}
function schedule() { if (!enabled) return; clearTimeout(timer); retry = Math.min(retry + 1, 6); timer = setTimeout(open, Math.min(1000 * 2 ** retry, 30000)); }
export const realtime = {
  start() { if (!ws || ws.readyState > 1) open(); },
  stop() { enabled = false; clearTimeout(timer); ws && ws.close(); ws = null; },
  enable(v) { enabled = v; if (v) this.start(); else { clearTimeout(timer); ws && ws.close(); ws = null; setStatus('reconnecting'); } },
  restart() { ws && ws.close(); ws = null; enabled = true; open(); },
  subscribe(channel) { ws && ws.readyState === 1 && ws.send(JSON.stringify({ type: 'subscribe', channel })); },
  on(h) { handlers.add(h); return () => handlers.delete(h); },
  onStatus(h) { statusHandlers.add(h); h({ status, lastAt }); return () => statusHandlers.delete(h); },
  get status() { return status; },
};
