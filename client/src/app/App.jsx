import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Portal from './Portal';
import { SessionProvider, useSession } from '../shared/hooks/useSession';
import { PrefsProvider } from '../shared/hooks/usePrefs';
import { ToastProvider } from '../shared/components/Toast';
import Skeleton from '../shared/components/Skeleton';
import { realtime } from '../shared/lib/realtime';
import { SA_PATH } from './portals';
const PlayerHome = lazy(() => import('../portals/player/layout/PlayerHome'));
const GuestLayout = lazy(() => import('../portals/guest/layout/GuestLayout'));
const AuthLayout = lazy(() => import('../portals/auth/layout/AuthLayout'));
const PlayerLoginPage = lazy(() => import('../portals/auth/features/player-login/pages/PlayerLoginPage.jsx'));
const ActivationPage = lazy(() => import('../portals/auth/features/activation/pages/ActivationPage.jsx'));
const TeamAccessPage = lazy(() => import('../portals/auth/features/team-access/pages/TeamAccessPage.jsx'));
const SuperAdminLoginPage = lazy(() => import('../portals/auth/features/super-admin-login/pages/SuperAdminLoginPage.jsx'));
function RealtimeSwitch() { const { features, user } = useSession(); useEffect(() => { realtime.enable(user ? features.realtime_updates !== false : true); }, [features.realtime_updates, user]); return null; }
function NoIndex() { const l = useLocation(); useEffect(() => { const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m); return () => m.remove(); }, [l.pathname]); return null; }
export default function App() {
  return <BrowserRouter><PrefsProvider><ToastProvider><SessionProvider><RealtimeSwitch />
    <Suspense fallback={<div className="p-6"><Skeleton lines={5} /></div>}><Routes>
      <Route element={<AuthLayout />}>
        <Route path="/player-login" element={<PlayerLoginPage />} /><Route path="/activate" element={<ActivationPage />} />
        <Route path="/team-access" element={<><NoIndex /><TeamAccessPage /></>} />
        {SA_PATH && <Route path={`/${SA_PATH}`} element={<><NoIndex /><SuperAdminLoginPage /></>} />}
      </Route>
      <Route path="/app/*" element={<Portal slug="player" roles={['player']} base="/app" loginPath="/player-login" extra={{ Home: PlayerHome, menu: { key: 'player.home', label: 'Home', icon: 'home', path: '', order: 0, menuGroup: 'Main', tab: 1 } }} />} />
      <Route path="/staff/*" element={<Portal slug="staff" roles={['staff']} base="/staff" loginPath="/team-access" />} />
      <Route path="/referee/*" element={<Portal slug="coach-referee" roles={['coach_referee']} base="/referee" loginPath="/team-access" />} />
      <Route path="/admin/*" element={<Portal slug="admin" roles={['admin', 'super_admin']} base="/admin" loginPath="/team-access" />} />
      {SA_PATH && <Route path={`/${SA_PATH}/console/*`} element={<Portal slug="super-admin" roles={['super_admin']} base={`/${SA_PATH}/console`} loginPath={`/${SA_PATH}`} />} />}
      <Route path="/*" element={<GuestLayout />} />
    </Routes></Suspense></SessionProvider></ToastProvider></PrefsProvider></BrowserRouter>;
}
