import { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../shared/components/AppShell';
import Skeleton from '../shared/components/Skeleton';
import EmptyState from '../shared/components/EmptyState';
import { FeatureGate } from '../shared/hooks/useFeature';
import { useSession } from '../shared/hooks/useSession';
import { loadManifests } from './portals';
export function Forbidden({ text = 'You do not have access to this page. Please ask the front desk.' }) { return <div className="max-w-md mx-auto py-16 px-4"><EmptyState title="No access" text={text} /></div>; }
const FeatureOff = () => <EmptyState title="Not available" text="This feature is not turned on for your club." />;
/** One portal per role. Menu, routes and the bottom tab bar are all built from the manifests (route guards read THIS tab's session). */
export default function Portal({ slug, roles, base, loginPath, extra }) {
  const { ready, user, features } = useSession(); const loc = useLocation(); const [manifests, setManifests] = useState(null);
  const allowed = !!user && roles.includes(user.role);
  useEffect(() => { if (allowed) loadManifests(slug).then(setManifests); }, [allowed, slug]);
  if (!ready) return <div className="p-6"><Skeleton /></div>;
  if (!user) return <Navigate to={loginPath} replace state={{ from: loc.pathname }} />;
  if (!allowed) return <Forbidden />;
  if (!manifests) return <div className="p-6"><Skeleton /></div>;
  const visible = manifests.filter(m => !m.featureKey || features[m.featureKey]);
  const items = [...(extra ? [extra.menu] : []), ...visible];
  const first = items[0];
  return <Routes><Route element={<AppShell role={user.role === 'super_admin' && slug !== 'super-admin' ? 'super_admin' : user.role} base={base} items={items} />}>
    {extra && <Route index element={<Suspense fallback={<Skeleton />}><extra.Home /></Suspense>} />}
    {!extra && first && <Route index element={<Navigate to={first.path || '.'} replace />} />}
    {manifests.flatMap(m => m.routes.map(r => <Route key={m.key + r.path} path={r.path} element={<FeatureGate featureKey={m.featureKey} fallback={<FeatureOff />}><Suspense fallback={<Skeleton lines={5} />}><r.component /></Suspense></FeatureGate>} />))}
    <Route path="*" element={<EmptyState title="We could not find that page" text="Use the menu to go somewhere else." />} />
  </Route></Routes>;
}
