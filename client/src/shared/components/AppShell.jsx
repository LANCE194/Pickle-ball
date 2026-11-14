import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Sun, Moon, HelpCircle, Bell, Menu, MoreHorizontal, ChevronLeft, ChevronRight, Wifi, WifiOff, Languages, Type } from '../lib/icons';
import Button from './Button';
import Drawer from './Drawer';
import { HelpDrawer, NotificationsDrawer, WelcomeTour, ChangePassword, useUnread } from './Overlays';
import { useSession } from '../hooks/useSession';
import { useClock } from '../hooks/useClock';
import { useLiveStatus, useRealtime } from '../hooks/useRealtime';
import { usePrefs } from '../hooks/usePrefs';
import { useToast } from './Toast';
import { playNotificationSound, unlockNotificationSound } from '../lib/notificationSound';
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', staff: 'Staff', coach_referee: 'Coach / Referee', player: 'Player' };
const NOTIFICATION_TARGETS = {
  booking: ['my-schedule', 'bookings', 'book-court'],
  reminder: ['my-schedule', 'bookings'],
  payment: ['payment-queue', 'payments'],
  inquiry: ['inquiries'],
  feature: ['feature-control', 'feature-availability', 'features'],
  site: ['site-designer', 'deployments'],
  chat: ['chat', 'messages'],
  tournament: ['tournaments'],
  openplay: ['find-players'],
  membership: ['membership'],
};
/** Page shell: same header, menu order and title row for every role. Menu items come from the feature manifests (never hard-coded here). */
export default function AppShell({ role, base, items }) {
  const { user, signOut } = useSession(); const nav = useNavigate(); const location = useLocation(); const clock = useClock(); const live = useLiveStatus(); const { dark, setDark, large, setLarge, lang, setLang, t } = usePrefs(); const toast = useToast();
  const [help, setHelp] = useState(false), [bell, setBell] = useState(false), [more, setMore] = useState(false), [collapsed, setCollapsed] = useState(false), [soundEnabled, setSoundEnabled] = useState(true); const { unread, clear } = useUnread();
  const soundKey = `dn_notification_sound_${user?.id || 'user'}`;
  const to = i => `${base}${i.path ? '/' + i.path : ''}`.replace(/\/$/, '') || '/';
  useEffect(() => { setSoundEnabled(localStorage.getItem(soundKey) !== 'off'); }, [soundKey]);
  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);
  const notificationPath = useCallback(notification => {
    for (const candidate of NOTIFICATION_TARGETS[notification.kind] || []) {
      const item = items.find(i => i.key?.endsWith(`.${candidate}`) || i.path === candidate);
      if (item) return to(item);
    }
    const notifications = items.find(i => i.path === 'notifications');
    return notifications ? to(notifications) : null;
  }, [items, base]);
  const openNotification = useCallback(notification => {
    setBell(false);
    const path = notificationPath(notification);
    if (path) nav(path);
    else setBell(true);
  }, [nav, notificationPath]);
  const onRealtimeNotification = useCallback(message => {
    const notification = message.data;
    if (!notification?.id || notification.kind === 'otp') return;
    if (soundEnabled) playNotificationSound();
    toast.notification(notification, () => openNotification(notification));
  }, [openNotification, soundEnabled, toast]);
  useRealtime(['notification.new'], onRealtimeNotification);
  const onSoundChange = enabled => {
    setSoundEnabled(enabled);
    localStorage.setItem(soundKey, enabled ? 'on' : 'off');
    if (enabled) unlockNotificationSound();
  };
  const tabs = useMemo(() => { const withTab = items.filter(i => i.tab).sort((a, b) => a.tab - b.tab).slice(0, 5); return withTab.length ? withTab : items.slice(0, 4); }, [items]);
  const fullScreenDesigner = ['admin', 'super_admin'].includes(role) && location.pathname === `${base}/site-designer`;
  const rest = items.filter(i => !tabs.includes(i)); const groups = [...new Set(items.map(i => i.menuGroup))];
  const logout = async () => { await signOut(); nav('/'); };
  const linkCls = ({ isActive }) => `sidebar-link flex items-center gap-3 min-h-tap px-3 rounded-card ${isActive ? 'sidebar-link-active bg-court text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`;
  const LiveDot = () => <span className="inline-flex items-center gap-1 text-xs muted" role="status">{live.status === 'live' ? <Wifi className="live-indicator rounded-full" size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}{live.status === 'live' ? 'Live' : 'Reconnecting'}{live.lastAt && <span className="hidden sm:inline"> - Last updated {live.lastAt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour12: true })}</span>}</span>;
  return <div className="app-shell min-h-screen flex flex-col">
    <header className="app-topbar sticky top-0 z-40 surface border-b line pt-[env(safe-area-inset-top)]"><div className="flex flex-wrap items-center gap-2 px-3 py-2 md:flex-nowrap md:px-6 md:py-0 md:min-h-[60px]">
      <span className="site-brand-lockup font-heading font-bold text-lg text-court dark:text-volt mr-1"><span className="brand-orb" aria-hidden="true" />DinkNest</span>
      <div className="text-[10px] leading-tight sm:text-sm" aria-label="Server time in Manila"><div>{clock.date}</div><div className="font-semibold">{clock.time} {clock.tz}</div></div>
      <div className="hidden flex-1 md:block" />
      <div className="flex w-full items-center gap-2 md:w-auto md:contents">
        <div className="flex min-w-0 max-w-[45%] flex-col leading-tight md:ml-auto md:max-w-none md:items-end md:pl-2 md:border-l line" aria-label={`Signed in as ${user?.name}, ${ROLE_LABEL[role]}`}>
          <span className="max-w-full truncate text-xs md:text-sm">{user?.name}</span>
          <span className="text-xs px-2 rounded-full bg-court/15 text-court dark:text-volt">{ROLE_LABEL[role]}</span>
        </div>
        <div className="flex-1 md:hidden" />
        <div className="hidden md:block"><LiveDot /></div>
        <button type="button" onClick={() => setBell(true)} className="relative min-h-tap min-w-tap inline-flex items-center justify-center rounded-card hover:bg-black/5 dark:hover:bg-white/10" aria-label={`${t('Notifications')}${unread ? `, ${unread} new` : ''}`}><Bell aria-hidden="true" />{unread > 0 && <span className="badge-pop absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-alert text-alert-ink text-xs flex items-center justify-center px-1">{unread}</span>}</button>
        <button type="button" onClick={() => setDark(!dark)} className="min-h-tap min-w-tap inline-flex items-center justify-center rounded-card hover:bg-black/5 dark:hover:bg-white/10" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>
        <button type="button" onClick={() => setHelp(true)} className="min-h-tap inline-flex items-center gap-1 px-2 rounded-card hover:bg-black/5 dark:hover:bg-white/10" aria-label={t('Help')}><HelpCircle aria-hidden="true" /><span className="hidden sm:inline">{t('Help')}</span></button>
      </div>
    </div></header>
    <div className="flex flex-1">
      <aside className={`app-sidebar hidden md:flex flex-col surface border-r line ${collapsed ? 'w-[72px]' : 'w-64'} transition-all duration-base`} aria-label="Main menu">
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">{groups.map(g => <div key={g} className="mb-2">{!collapsed && <p className="px-3 pt-2 text-xs uppercase tracking-wide muted">{g}</p>}{items.filter(i => i.menuGroup === g).map(i => <NavLink key={i.key} to={to(i)} end className={linkCls} title={i.label}><Icon name={i.icon} size={20} />{!collapsed && <span>{i.label}</span>}</NavLink>)}</div>)}</nav>
        <div className="p-2 border-t line space-y-1">
          <Button variant="ghost" full onClick={() => setCollapsed(!collapsed)} icon={collapsed ? ChevronRight : ChevronLeft}>{collapsed ? '' : 'Collapse menu'}</Button>
          {!collapsed && <><Button variant="ghost" full icon={Type} onClick={() => setLarge(!large)}>{large ? 'Normal text' : 'Larger text'}</Button><Button variant="ghost" full icon={Languages} onClick={() => setLang(lang === 'en' ? 'fil' : 'en')}>{lang === 'en' ? 'Filipino' : 'English'}</Button></>}
          <Button variant="secondary" full onClick={logout}>{collapsed ? 'Out' : t('Log out')}</Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 min-h-0"><div className={`mx-auto px-3 md:px-6 py-3 ${fullScreenDesigner ? 'w-full max-w-none pb-8' : 'max-w-page pb-40 md:pb-8'}`}>{user?.mustChangePassword ? <ChangePassword /> : <Outlet context={{ onNotificationClick: openNotification }} />}</div></main>
    </div>
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 surface border-t line pb-[env(safe-area-inset-bottom)]" aria-label="Main menu"><ul className="flex">
      {tabs.map(i => <li key={i.key} className="flex-1"><NavLink to={to(i)} end className={({ isActive }) => `flex flex-col items-center justify-center min-h-[56px] text-xs gap-0.5 ${isActive ? 'text-court dark:text-volt font-semibold' : 'muted'}`}><Icon name={i.icon} size={22} /><span>{t(i.label.replace('Book Court', 'Book').replace('My Profile and Level', 'Profile').replace('Members and Plans', 'Members'))}</span></NavLink></li>)}
      <li className="flex-1"><button type="button" onClick={() => setMore(true)} className="w-full flex flex-col items-center justify-center min-h-[56px] text-xs gap-0.5 muted"><MoreHorizontal size={22} aria-hidden="true" /><span>{t('More')}</span></button></li></ul></nav>
    <Drawer open={more} onClose={() => setMore(false)} title={t('More')}>
      <ul className="space-y-1">{rest.map(i => <li key={i.key}><NavLink to={to(i)} onClick={() => setMore(false)} className={linkCls}><Icon name={i.icon} size={20} />{i.label}</NavLink></li>)}</ul>
      <div className="mt-4 space-y-2 border-t line pt-4"><div className="md:hidden"><LiveDot /></div><p className="font-medium">{user?.name} <span className="text-xs px-2 rounded-full bg-court/15 text-court dark:text-volt">{ROLE_LABEL[role]}</span></p>
        <Button variant="ghost" full icon={Type} onClick={() => setLarge(!large)}>{large ? 'Normal text' : 'Larger text'}</Button><Button variant="ghost" full icon={Languages} onClick={() => setLang(lang === 'en' ? 'fil' : 'en')}>{lang === 'en' ? 'Filipino' : 'English'}</Button><Button variant="secondary" full onClick={logout}>{t('Log out')}</Button></div>
    </Drawer>
    <HelpDrawer open={help} onClose={() => setHelp(false)} role={role} /><NotificationsDrawer open={bell} onClose={() => setBell(false)} onRead={clear} onNotificationClick={openNotification} soundEnabled={soundEnabled} onSoundChange={onSoundChange} /><WelcomeTour role={role} />
  </div>;
}
