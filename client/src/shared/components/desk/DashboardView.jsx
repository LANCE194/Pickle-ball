import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colors } from '../../theme/tokens';
import { useApi } from '../../hooks/useApi';
import { peso } from '../../lib/format';
import PageHeader from '../PageHeader';
import Card from '../Card';
import Button from '../Button';
import Skeleton from '../Skeleton';
import ErrorPanel from '../ErrorPanel';
import EmptyState from '../EmptyState';
import StatusBadge from '../StatusBadge';
const Counter = ({ label, value }) => <Card><p className="muted">{label}</p><p className="text-3xl font-bold mt-1">{value}</p></Card>;
/** Admin dashboard (counters + charts + pending items + quick links) and the staff version (today only, no revenue). */
export default function DashboardView({ path, admin = false, links = [] }) {
  const nav = useNavigate(); const { data: d, loading, error, reload } = useApi(path, null, { events: ['booking.changed', 'payment.queue', 'availability.changed'] });
  if (loading) return <Skeleton lines={6} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <div className="space-y-4"><PageHeader title="Dashboard" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Counter label="Today's bookings" value={d.today_bookings} /><Counter label="Waiting payments" value={d.pending_payments} />{admin ? <><Counter label="Revenue today" value={peso(d.revenue_today)} /><Counter label="Court use today" value={`${d.utilization_percent}%`} /><Counter label="New members (30 days)" value={d.new_members_30d} /><Counter label="Revenue (30 days)" value={peso(d.revenue_30d)} /><Counter label="Open courts" value={d.active_courts} /></> : <Counter label="Held bookings today" value={d.pending_bookings} />}</div>
    <div className="flex flex-wrap gap-2">{links.map(l => <Button key={l.to} variant="secondary" onClick={() => nav(l.to)}>{l.label}</Button>)}</div>
    {admin && <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="mb-2">Revenue, last 14 days</h2>{d.revenue_chart.length ? <div className="h-56" role="img" aria-label="Revenue chart"><ResponsiveContainer><LineChart data={d.revenue_chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={x => x.slice(5)} /><YAxis /><Tooltip formatter={v => peso(v)} /><Line type="monotone" dataKey="revenue" stroke={colors.court} strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <p className="muted">No revenue yet.</p>}</Card>
      <Card><h2 className="mb-2">Court hours used, last 14 days</h2>{d.utilization_chart.length ? <div className="h-56" role="img" aria-label="Court use chart"><ResponsiveContainer><BarChart data={d.utilization_chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={x => x.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="hours" fill={colors.blue} /></BarChart></ResponsiveContainer></div> : <p className="muted">No bookings yet.</p>}</Card></div>}
    {!admin && <Card><h2 className="mb-2">Booking activity, last 7 days</h2>{d.bookings_chart?.length ? <div className="h-56" role="img" aria-label="Booking activity chart"><ResponsiveContainer><BarChart data={d.bookings_chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={x => x.slice(5)} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="bookings" fill={colors.court} /></BarChart></ResponsiveContainer></div> : <p className="muted">No booking activity this week.</p>}</Card>}
    <section><h2 className="mb-2">Today's schedule</h2>{d.today_schedule.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.today_schedule.map(s => <Card key={s.id}><div className="flex justify-between gap-2"><p className="font-semibold">{s.time_label}</p><StatusBadge status={s.status} /></div><p>{s.court_label}</p><p className="muted">{s.player_name || 'Guest'}</p></Card>)}</div> : <EmptyState title="No bookings today" text="Walk-in and player bookings will show here." />}</section></div>;
}
