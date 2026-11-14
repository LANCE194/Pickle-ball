import { useEffect, useState } from 'react';
import Drawer from './Drawer';
import Button from './Button';
import FormField from './FormField';
import Card from './Card';
import { HELP, TOUR } from './helpContent';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { useApi } from '../hooks/useApi';
import { useRealtime } from '../hooks/useRealtime';
import { Skeleton } from './DataList';
import EmptyState from './EmptyState';
import { Bell } from '../lib/icons';
export function HelpDrawer({ open, onClose, role }) {
  return <Drawer open={open} onClose={onClose} title="Help">
    <ol className="list-decimal pl-5 space-y-3">{(HELP[role] || HELP.guest).map(s => <li key={s}>{s}</li>)}</ol>
    <Card className="mt-6"><h3>Still stuck?</h3><p className="muted mt-1">Ask the club front desk. They can help you in person.</p></Card>
  </Drawer>;
}
export function WelcomeTour({ role }) {
  const k = `dn_tour_${role}`; const steps = TOUR[role]; const [i, setI] = useState(0); const [open, setOpen] = useState(() => !!steps && !localStorage.getItem(k));
  if (!open || !steps) return null; const [t, text] = steps[i]; const last = i === steps.length - 1; const done = () => { localStorage.setItem(k, '1'); setOpen(false); };
  return <div className="fixed inset-0 z-[65] flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome tour"><div className="absolute inset-0 bg-black/50" />
    <Card className="relative max-w-md w-full slide-up"><p className="text-sm muted">Step {i + 1} of {steps.length}</p><h2 className="mt-1">{t}</h2><p className="mt-2">{text}</p>
      <div className="mt-5 flex justify-between gap-2"><Button variant="ghost" onClick={done}>Skip</Button><Button onClick={() => (last ? done() : setI(i + 1))}>{last ? 'Got it' : 'Next'}</Button></div></Card></div>;
}
export function NotificationsDrawer({ open, onClose, onRead, onNotificationClick, soundEnabled, onSoundChange }) {
  const { data, loading, reload } = useApi('/api/notifications', null, { events: ['notification.new'], enabled: open });
  const items = (data?.items || []).filter(n => n.kind !== 'otp');
  useEffect(() => { if (open && data?.unread) api.post('/api/notifications/read').then(onRead).catch(() => {}); }, [open, data?.unread]); // eslint-disable-line
  return <Drawer open={open} onClose={onClose} title="Notifications">
    <FormField type="checkbox" label="Play a sound for new notifications" helper="Browsers may require your first interaction with the app before sound can play." value={soundEnabled} onChange={e => onSoundChange(e.target.value)} className="mb-4" />
    {loading ? <Skeleton /> : !items.length ? <EmptyState icon={Bell} title="No notifications yet" text="Booking and payment updates will show up here." /> :
      <ul className="space-y-3">{items.map(n => <li key={n.id}><Card className={n.read_at ? '' : 'border-court'}><button type="button" onClick={() => onNotificationClick(n)} className="w-full text-left rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-court"><p className="font-medium">{n.title}</p><p className="muted">{n.body}</p><p className="text-sm muted mt-1">{n.date_label}, {n.time_label}</p></button></Card></li>)}</ul>}
  </Drawer>;
}
export function useUnread() {
  const { data, reload } = useApi('/api/notifications', null, { events: ['notification.new'] }); const [local, setLocal] = useState(null);
  useEffect(() => setLocal(null), [data]); useRealtime(['notification.new'], () => reload());
  return { unread: local ?? (data?.items || []).filter(n => !n.read_at && n.kind !== 'otp').length, clear: () => setLocal(0) };
}
/** Shown instead of the portal when a temporary password must be replaced. */
export function ChangePassword() {
  const { refresh } = useSession(); const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' }); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const go = async () => {
    if (f.newPassword !== f.confirm) return setErr({ confirm: 'The two passwords do not match.' });
    setBusy(true); setErr({}); try { await api.post('/api/auth/change-password', { currentPassword: f.currentPassword, newPassword: f.newPassword }); await refresh(); } catch (e) { setErr(e.fields || { currentPassword: e.message }); } finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto py-8"><Card><h1>Set your new password</h1><p className="muted mt-1">For your safety, replace the temporary password before you continue.</p>
    <div className="mt-4 space-y-4"><FormField label="Temporary password" type="password" name="currentPassword" value={f.currentPassword} onChange={set} error={err.currentPassword} helper="The one you were given." />
      <FormField label="New password" type="password" name="newPassword" autoComplete="new-password" value={f.newPassword} onChange={set} error={err.newPassword} helper="At least 8 characters with a letter and a number." />
      <FormField label="Type the new password again" type="password" name="confirm" autoComplete="new-password" value={f.confirm} onChange={set} error={err.confirm} />
      <Button full loading={busy} onClick={go}>Save new password</Button></div></Card></div>;
}
