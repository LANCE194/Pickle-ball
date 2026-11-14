import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
/** GET helper with loading + error state. Refreshes on server events, and polls every 20 s when live updates are not connected. */
export function useApi(path, params, { events, enabled = true, pollMs = 20000 } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = path + JSON.stringify(params || {}); const alive = useRef(true);
  const load = useCallback(async (quiet = false) => {
    if (!enabled || !path) return; if (!quiet) setState(s => ({ ...s, loading: true, error: null }));
    try { const data = await api.get(path, params); if (alive.current) setState({ data, loading: false, error: null }); }
    catch (error) { if (alive.current) setState(s => ({ data: quiet ? s.data : null, loading: false, error })); }
  }, [key, enabled]); // eslint-disable-line
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);
  useEffect(() => realtime.on(m => { if (events && (m.event === 'reconnected' || events.includes(m.event))) load(true); }), [load, events && events.join()]); // eslint-disable-line
  useEffect(() => { if (!enabled || !path) return undefined; const t = setInterval(() => { if (realtime.status !== 'live') load(true); }, pollMs); return () => clearInterval(t); }, [load, enabled, pollMs, path]);
  return { ...state, reload: () => load(false), refresh: () => load(true), setData: data => setState(s => ({ ...s, data })) };
}
