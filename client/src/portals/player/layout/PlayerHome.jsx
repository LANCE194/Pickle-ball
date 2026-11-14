import { useNavigate } from 'react-router-dom';
import { CalendarPlus } from '../../../shared/lib/icons';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import StatusBadge from '../../../shared/components/StatusBadge';
import Skeleton from '../../../shared/components/Skeleton';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorPanel from '../../../shared/components/ErrorPanel';
import { useApi } from '../../../shared/hooks/useApi';
import { useSession } from '../../../shared/hooks/useSession';
import { useFeature } from '../../../shared/hooks/useFeature';
import { peso } from '../../../shared/lib/format';
import { colors } from '../../../shared/theme/tokens';
/** Player Home: next booking card, one big Book a Court button, Book again, open play near my level, upcoming events. */
export default function PlayerHome() {
  const nav = useNavigate(); const { user } = useSession(); const open = useFeature('open_play'); const ev = useFeature('events_announcements');
  const sched = useApi('/api/player/my-schedule', null, { events: ['booking.changed', 'availability.changed'] }); const last = useApi('/api/player/book-court/last');
  const activity = useApi('/api/player/my-schedule/activity', null, { events: ['booking.changed'] });
  const play = useApi('/api/player/find-players', null, { enabled: open, events: ['openplay.changed'] }); const events = useApi('/api/player/events', null, { enabled: ev });
  const next = sched.data?.[0];
  return <div className="space-y-6 pb-20 md:pb-0"><h1>Hi, {user?.name}</h1>
    <Card>{sched.loading ? <Skeleton /> : next ? <div className="space-y-2"><div className="flex items-center justify-between gap-2"><h2>Your next game</h2><StatusBadge status={next.status} /></div>
        <p className="text-lg font-semibold">{next.date_label}</p><p>{next.time_label}</p><p>{next.court_label}</p>
        {next.payment_status === 'unpaid' && <Button variant="book" onClick={() => nav('/app/payments')}>Send payment proof</Button>}</div>
      : <EmptyState title="You have no bookings yet" text="Book your first court. It takes three taps." actionLabel="Book your first court" onAction={() => nav('/app/book')} />}</Card>
    <div className="grid gap-3 sm:grid-cols-2"><Button variant="book" icon={CalendarPlus} onClick={() => nav('/app/book')} className="min-h-[56px] text-lg">Book a Court</Button>
      {last.data && <Button variant="secondary" onClick={() => nav('/app/book', { state: { again: last.data } })} className="min-h-[56px]">Book again (same court and length)</Button>}</div>
    <Card><h2 className="mb-2">Your booking activity, last 14 days</h2>{activity.loading ? <Skeleton /> : activity.error ? <ErrorPanel error={activity.error} onRetry={activity.reload} /> : activity.data?.length ? <div className="h-56" role="img" aria-label="Your booking activity chart"><ResponsiveContainer><BarChart data={activity.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={date => date.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="bookings" fill={colors.court} /></BarChart></ResponsiveContainer></div> : <p className="muted">Your confirmed games will appear here.</p>}</Card>
    {open && <section><h2 className="mb-2">Open play near my level</h2>{play.loading ? <Skeleton /> : !(play.data || []).filter(p => p.in_my_level).length ? <Card><p className="muted">No open games at your level right now.</p><div className="mt-3"><Button variant="secondary" onClick={() => nav('/app/find-players')}>Find players</Button></div></Card>
      : <div className="grid gap-3 sm:grid-cols-2">{play.data.filter(p => p.in_my_level).slice(0, 4).map(p => <Card key={p.id}><p className="font-semibold">{p.date_label}</p><p>{p.time_label}</p><p>{p.court_label}</p><p className="muted">{p.spots_left} spot{p.spots_left === 1 ? '' : 's'} left, {p.cost_label}</p><div className="mt-2"><Button variant="secondary" onClick={() => nav('/app/find-players')}>See game</Button></div></Card>)}</div>}</section>}
    {ev && <section><h2 className="mb-2">Upcoming events</h2>{events.loading ? <Skeleton /> : !events.data?.length ? <Card><p className="muted">No events right now.</p></Card> : <div className="grid gap-3 sm:grid-cols-2">{events.data.slice(0, 3).map(e => <Card key={e.id}><p className="font-semibold">{e.title}</p>{e.date_label && <p className="muted">{e.date_label}</p>}</Card>)}</div>}</section>}
  </div>;
}
