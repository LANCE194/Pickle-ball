import { useNavigate } from 'react-router-dom';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
import EmptyState from '../../../../../shared/components/EmptyState';
export default function MembershipPage() {
  const nav = useNavigate(); const toast = useToast(); const me = useApi('/api/player/membership'); const plans = useApi('/api/player/membership/plans');
  const join = async id => { try { const r = await api.post('/api/player/membership/join', { plan_id: id }); toast.ok(r.message); nav(`/app/payments/${r.payment_id}`); } catch (e) { toast.error(e.message); } };
  const m = me.data; const active = m && ['active', 'expiring'].includes(m.status);
  return <div className="space-y-4 max-w-3xl"><PageHeader title="Membership" />
    {me.loading ? <Skeleton /> : active ? <Card className="space-y-1"><div className="flex justify-between gap-2"><h2>{m.plan_name}</h2><StatusBadge status={m.status} /></div><p>Valid until <strong>{m.expires_label}</strong></p><p>{Number(m.discount_percent)}% off court time{m.priority_booking ? ', priority booking' : ''}</p>{m.perks && <p className="muted">{m.perks}</p>}</Card>
      : <Card><h2>No active membership</h2><p className="muted">{m ? 'Your membership ended, so member discounts stopped. Renew below.' : 'Join a plan to get discounts on court time.'}</p></Card>}
    <h2>Plans</h2>{plans.loading ? <Skeleton /> : !plans.data?.length ? <EmptyState title="No plans yet" text="The club has not set up membership plans." /> : <div className="grid gap-3 sm:grid-cols-2">{plans.data.map(p => <Card key={p.id} className="space-y-1"><h3>{p.name}</h3><p className="text-2xl font-bold">{p.price_label}</p><p className="muted">{p.duration_days} days, {Number(p.discount_percent)}% off{p.priority_booking ? ', priority booking' : ''}</p>{p.perks && <p>{p.perks}</p>}<Button variant="book" onClick={() => join(p.id)}>{active ? 'Renew with this plan' : 'Join this plan'}</Button></Card>)}</div>}</div>;
}
