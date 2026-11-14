import { useEffect, useState } from 'react';
import { realtime } from '../lib/realtime';
/** Calls handler(message) for server events. Pass event names to filter. */
export function useRealtime(events, handler) {
  useEffect(() => realtime.on(m => { if (!events || events.includes(m.event)) handler(m); }), [events && events.join(), handler]); // eslint-disable-line
}
export function useLiveStatus() { const [s, setS] = useState({ status: realtime.status, lastAt: null }); useEffect(() => realtime.onStatus(setS), []); return s; }
