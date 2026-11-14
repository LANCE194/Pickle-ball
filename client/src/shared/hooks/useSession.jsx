import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import { realtime } from '../lib/realtime';
const Ctx = createContext(null);
/** Session state for THIS tab only. Role menus, guards and the header read from here (rule D). */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null, features: {} });
  const loadFeatures = useCallback(async () => { try { return (await api.get('/api/features')).features; } catch { return {}; } }, []);
  const refresh = useCallback(async () => {
    const features = await loadFeatures();
    if (!getToken()) return setState({ ready: true, user: null, features });
    try { const me = await api.get('/api/auth/me'); setState({ ready: true, user: me, features: me.features || features }); realtime.start(); }
    catch { setToken(null); setState({ ready: true, user: null, features }); }
  }, [loadFeatures]);
  useEffect(() => { refresh(); }, [refresh]);
  const signIn = useCallback(async data => { setToken(data.token); realtime.restart(); await refresh(); return data.user; }, [refresh]);
  const signOut = useCallback(async () => { try { await api.post('/api/auth/logout'); } catch { /* already gone */ } setToken(null); realtime.stop(); setState(s => ({ ...s, user: null })); }, []);
  useEffect(() => { setUnauthorizedHandler(() => { setToken(null); setState(s => ({ ...s, user: null })); }); }, []);
  useEffect(() => realtime.on(m => {
    if (m.event === 'features.changed') loadFeatures().then(f => setState(s => ({ ...s, features: f }))); // menus update live
    if (m.event === 'session.revoked') { setToken(null); setState(s => ({ ...s, user: null })); }          // force logout at once
  }), [loadFeatures]);
  useEffect(() => { const f = () => setState(s => (s.user ? { ...s, user: { ...s.user, mustChangePassword: true } } : s)); window.addEventListener('dn:must-change-password', f); return () => window.removeEventListener('dn:must-change-password', f); }, []);
  const value = useMemo(() => ({ ...state, signIn, signOut, refresh }), [state, signIn, signOut, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);
