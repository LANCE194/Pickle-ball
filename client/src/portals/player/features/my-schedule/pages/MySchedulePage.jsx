import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus } from '../../../../../shared/lib/icons';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
export default function MySchedulePage() {
  const nav = useNavigate(); const toast = useToast(); const [when, setWhen] = useState('upcoming'); const [cancel, setCancel] = useState(null); const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useApi('/api/player/my-schedule', { when }, { events: ['booking.changed', 'availability.changed'] });
  const run = async () => { setBusy(true); try { const r = await api.post(`/api/player/my-schedule/${cancel.id}/cancel`); toast.ok(r.message); setCancel(null); reload(); } catch (e) { toast.error(e.message); setCancel(null); } finally { setBusy(false); } };
  return <><PageHeader title="My Schedule" action={{ label: 'Book a court', icon: CalendarPlus, onClick: () => nav('/app/book') }} />
    <div className="flex gap-2 mb-4">{['upcoming', 'past'].map(w => <Button key={w} variant={when === w ? 'primary' : 'secondary'} onClick={() => setWhen(w)}>{w === 'upcoming' ? 'Coming up' : 'Past games'}</Button>)}</div>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: when === 'upcoming' ? 'You have no bookings yet' : 'No past games yet', text: when === 'upcoming' ? 'Book your first court.' : '', actionLabel: when === 'upcoming' ? 'Book your first court' : undefined, onAction: () => nav('/app/book') }}
      renderItem={b => <Card className="h-full space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold text-lg">{b.date_label}</p><StatusBadge status={b.status} /></div><p>{b.time_label}</p><p>{b.court_label}</p><p className="muted">{b.price_label}</p>
        {b.status === 'pending' && b.payment_status === 'unpaid' && <p className="text-sm">Held for you until {new Date(b.expires_at).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true })}. Send payment proof to confirm.</p>}
        <div className="flex flex-wrap gap-2">{b.status === 'pending' && b.payment_status === 'unpaid' && <Button variant="book" onClick={() => nav('/app/payments')}>Send payment proof</Button>}{['pending', 'confirmed'].includes(b.status) && new Date(b.starts_at) > new Date() && <Button variant="ghost" onClick={() => setCancel(b)}>Cancel booking</Button>}</div></Card>} />
    <ConfirmDialog open={!!cancel} danger title="Cancel this booking?" text={cancel ? `${cancel.date_label}, ${cancel.time_label}, ${cancel.court_label}. You can cancel up to the cutoff set by the club before your game. After you cancel, the time is free for others.` : ''} confirmLabel="Yes, cancel booking" cancelLabel="No, keep it" loading={busy} onCancel={() => setCancel(null)} onConfirm={run} /></>;
}
