import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
import { fmtDate } from '../lib/format';
/** Live clock in Asia/Manila synced to the SERVER clock (never the device clock) and corrected after reconnects. */
export function useClock() {
  const offset = useRef(0); const [now, setNow] = useState(() => new Date());
  const sync = async () => { try { const t0 = Date.now(); const r = await api.get('/api/time'); const rtt = Date.now() - t0; offset.current = new Date(r.now).getTime() + rtt / 2 - Date.now(); } catch { /* keep the last offset */ } };
  useEffect(() => { sync(); const i = setInterval(() => setNow(new Date(Date.now() + offset.current)), 1000); const s = setInterval(sync, 5 * 60 * 1000); const off = realtime.on(m => m.event === 'reconnected' && sync()); return () => { clearInterval(i); clearInterval(s); off(); }; }, []);
  const o = { timeZone: 'Asia/Manila' };
  return { now, date: fmtDate(now), time: now.toLocaleTimeString('en-PH', { ...o, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase(), tz: 'PHT' };
}
