import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon } from '../../../shared/lib/icons';
import Button from '../../../shared/components/Button';
import Drawer from '../../../shared/components/Drawer';
import Skeleton from '../../../shared/components/Skeleton';
import EmptyState from '../../../shared/components/EmptyState';
import { HelpDrawer } from '../../../shared/components/Overlays';
import { FeatureGate } from '../../../shared/hooks/useFeature';
import { useSession } from '../../../shared/hooks/useSession';
import { useApi } from '../../../shared/hooks/useApi';
import { usePrefs } from '../../../shared/hooks/usePrefs';
import { loadManifests, SA_PATH } from '../../../app/portals';
import { apiUrl } from '../../../shared/lib/api';
import { accessibleColor, readableTextColor } from '../../../shared/lib/color';
import { colors } from '../../../shared/theme/tokens';
const LABEL_KEY = { 'guest.home': 'home', 'guest.courts-rates': 'courts', 'guest.live-availability': 'schedule', 'guest.events': 'events', 'guest.public-tournaments': 'tournaments', 'guest.about-contact-inquiry': 'about', 'guest.player-login-activation': 'login' };
/** Taps N times within `ms` -> callback. Used for the hidden entrances (no visible labels). */
function useTaps(n, cb, ms = 10000) { const hits = useRef([]); return () => { const now = Date.now(); hits.current = [...hits.current.filter(t => now - t < ms), now]; if (hits.current.length >= n) { hits.current = []; cb(); } }; }
function ComingSoon({ config }) { const brand = config.brand || { name: 'DinkNest', meaning: "DinkNest is a welcoming home court where pickleball players connect, play, and grow." }; return <div className="fade-in text-center py-24 px-4"><span className="brand-orb mx-auto mb-4" aria-hidden="true" /><p className="font-heading font-bold" style={{ color: 'var(--site-link-color, var(--site-primary))' }}>{brand.name}</p><p className="muted max-w-xl mx-auto mt-2">{brand.meaning}</p><h1 className="text-3xl mt-8">{config.sections?.[0]?.content?.title || `Welcome to ${brand.name}`}</h1><p className="mt-3 text-xl">Coming soon</p><p className="muted mt-2 max-w-md mx-auto">We are getting the courts ready. Check back soon.</p></div>; }
export default function GuestLayout() {
  const { user, features } = useSession(); const nav = useNavigate(); const loc = useLocation(); const { t, dark, setDark } = usePrefs(); const [manifests, setManifests] = useState(null); const [menu, setMenu] = useState(false); const [help, setHelp] = useState(false);
  const site = useApi('/api/site/public', null, { events: ['site.deployed'] });
  useEffect(() => { loadManifests('guest').then(setManifests); }, []);
  const toTeam = useTaps(5, () => nav('/team-access')); const toSuper = useTaps(5, () => SA_PATH && nav(`/${SA_PATH}`));
  const cfg = site.data?.config; const theme = cfg?.theme;
  const brand = cfg?.brand || { name: 'DinkNest', meaning: "DinkNest is a welcoming home court where pickleball players connect, play, and grow." };
  useEffect(() => { if (!theme) return; document.title = cfg.seo?.title || 'DinkNest'; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.headingFont)}:wght@500;600;700&family=${encodeURIComponent(theme.bodyFont)}:wght@400;500;600&display=swap`; document.head.appendChild(l); return () => l.remove(); }, [theme, cfg]);
  if (!manifests || site.loading) return <div className="p-6"><Skeleton lines={6} /></div>;
  const staffPreview = user && ['admin', 'staff', 'super_admin'].includes(user.role); const comingSoon = site.data?.coming_soon && !staffPreview;
  const items = manifests.filter(m => !m.featureKey || features[m.featureKey]);
  const labelOf = m => (cfg?.menu && cfg.menu[LABEL_KEY[m.key]]) || m.label;   const link = m => m.key === 'guest.player-login-activation' ? '/player-login' : (m.path ? `/${m.path}` : '/');
  const bookNow = () => nav(user?.role === 'player' ? '/app/book' : '/player-login', { state: { from: '/app/book' } }); // Book / Join opens Player Login, then returns here
  const style = theme ? {
    '--brand': theme.primary,
    '--accent': theme.accent,
    '--site-primary': theme.primary,
    '--site-accent': theme.accent,
    '--site-background': dark ? colors.navy : theme.background,
    '--site-text': dark ? colors.offwhite : theme.text,
    '--site-link-color': dark
      ? accessibleColor(theme.accent, colors.navy, colors.offwhite)
      : accessibleColor(theme.primary, theme.background, theme.text),
    '--site-heading-font': `'${theme.headingFont}', Poppins, sans-serif`,
    '--site-body-font': `'${theme.bodyFont}', Inter, system-ui, sans-serif`,
    fontFamily: `'${theme.bodyFont}', Inter, system-ui, sans-serif`,
  } : {};
  const home = user ? { player: '/app', staff: '/staff', admin: '/admin', coach_referee: '/referee' }[user.role] : null; // the public UI never names other roles
  return <div className="guest-site min-h-screen flex flex-col" style={style}>
    <header className="app-topbar surface border-b line sticky top-0 z-30 pt-[env(safe-area-inset-top)]"><div className="max-w-page mx-auto flex items-center gap-1 px-3 sm:gap-3 sm:px-4 min-h-[64px]">
      <button type="button" onClick={() => { toTeam(); }} className="site-brand-lockup shrink-0 whitespace-nowrap font-heading font-bold text-xl min-h-tap" style={theme ? { fontFamily: `'${theme.headingFont}', Poppins, sans-serif`, color: dark ? accessibleColor(theme.accent, colors.navy, colors.offwhite) : accessibleColor(theme.primary, theme.background, theme.text) } : undefined} onDoubleClick={() => nav('/')} aria-label={`${brand.name} home`}><span className="brand-orb" aria-hidden="true" />{cfg?.logo ? <img src={apiUrl(`/api/files/${cfg.logo}`)} alt={`${brand.name} logo`} className="h-9" /> : brand.name}</button>
      <nav className="hidden 2xl:flex gap-1 ml-4 whitespace-nowrap" aria-label="Main menu">{items.filter(m => m.key !== 'guest.player-login-activation').map(m => <Link key={m.key} to={link(m)} className={`nav-item min-h-tap inline-flex items-center px-2.5 text-sm rounded-card no-underline ${loc.pathname === link(m) ? 'font-semibold' : ''}`} aria-current={loc.pathname === link(m) ? 'page' : undefined} style={{ color: 'inherit' }}>{labelOf(m)}</Link>)}</nav>
      <div className="flex-1" />
      <button type="button" onClick={() => setDark(!dark)} className="min-h-tap min-w-tap inline-flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>
      {home ? <Button variant="secondary" className="shrink-0 whitespace-nowrap" onClick={() => nav(home)}>My account</Button> : <Button variant="secondary" className="hidden sm:inline-flex shrink-0 whitespace-nowrap" onClick={() => nav('/player-login', { state: { from: loc.pathname } })}>{cfg?.menu?.login || 'Player Login'}</Button>}
      <Button variant="book" onClick={bookNow} className="cta-glow shrink-0 whitespace-nowrap" style={theme ? { backgroundColor: theme.accent, color: readableTextColor(theme.accent) } : undefined}>{t('Book Now')}</Button>
      <button type="button" className="2xl:hidden min-h-tap min-w-tap inline-flex items-center justify-center" aria-label="Open menu" onClick={() => setMenu(true)}><Menu aria-hidden="true" /></button>
    </div></header>
    <main className="flex-1">{comingSoon ? <ComingSoon config={cfg} /> : <Suspense fallback={<div className="p-6"><Skeleton lines={5} /></div>}><Routes>
      {manifests.flatMap(m => m.routes.map(r => <Route key={m.key + r.path} path={r.path} element={<FeatureGate featureKey={m.featureKey} fallback={<div className="max-w-md mx-auto py-16 px-4"><EmptyState title="Not available" text="This feature is not turned on for your club." /></div>}><r.component site={cfg} onBook={bookNow} /></FeatureGate>} />))}
      <Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense>}</main>
    <footer className="surface border-t line mt-8"><div className="max-w-page mx-auto px-4 py-6 flex flex-wrap items-center gap-4 justify-between">
      <div><p className="font-semibold">{cfg?.sections?.find(s => s.kind === 'footer')?.content?.text || brand.name}</p><p className="muted text-sm max-w-lg">{brand.meaning}</p><div className="flex flex-wrap gap-3 mt-2">{(cfg?.sections?.find(s => s.kind === 'footer')?.content?.links || []).map(l => <a key={l.url} href={l.url} rel="noopener noreferrer" target="_blank">{l.label}</a>)}{['facebook', 'instagram', 'tiktok'].filter(k => cfg?.social?.[k]).map(k => <a key={k} href={cfg.social[k]} rel="noopener noreferrer" target="_blank" className="capitalize">{k}</a>)}</div></div>
      <div className="flex items-center gap-3"><Button variant="ghost" onClick={() => setHelp(true)}>Help</Button>
        <button type="button" onClick={toSuper} title="Tap five times to open Super Admin login" aria-label="Super Admin login (tap five times)" className="text-sm muted select-none bg-transparent border-0 p-0 cursor-pointer min-h-tap">&copy; {new Date().getFullYear()} {brand.name}</button>
        <button type="button" onClick={() => nav('/team-access')} tabIndex={-1} aria-hidden="true" className="h-6 w-6 rounded-full opacity-20 hover:opacity-60" style={{ background: 'currentColor' }} /></div></div></footer>
    <Drawer open={menu} onClose={() => setMenu(false)} title="Menu"><ul className="menu-enter space-y-1">{items.map(m => <li key={m.key}><Link onClick={() => setMenu(false)} to={link(m)} state={m.key === 'guest.player-login-activation' ? { from: loc.pathname } : undefined} className="flex min-h-tap items-center px-3 rounded-card no-underline hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'inherit' }}>{labelOf(m)}</Link></li>)}</ul></Drawer>
    <HelpDrawer open={help} onClose={() => setHelp(false)} role="guest" />
  </div>;
}
