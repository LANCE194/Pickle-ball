import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../../../shared/hooks/useApi';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import StatusBadge from '../../../../../shared/components/StatusBadge';
export default function PaymentsPage() {
  const nav = useNavigate(); const { data, loading, error, reload } = useApi('/api/player/payments', null, { events: ['notification.new', 'booking.changed'] });
  return <><PageHeader title="Payments" subtitle="Send proof of payment and see what staff checked." />
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No payments yet', text: 'When you book a court, your payment will show here.', actionLabel: 'Book a court', onAction: () => nav('/app/book') }}
      renderItem={p => <Card className="h-full space-y-2"><div className="flex justify-between gap-2"><p className="text-xl font-bold">{p.amount_label}</p><StatusBadge status={p.status} /></div><p>{p.status_text}</p>{p.schedule_line && <p className="muted">{p.schedule_line}</p>}<p className="text-sm muted">Reference {p.reference_code}</p>{p.status === 'rejected' && p.reject_reason && <p className="text-alert">Reason: {p.reject_reason}</p>}
        {['unpaid', 'rejected'].includes(p.status) && <Button variant="book" onClick={() => nav(`/app/payments/${p.id}`)}>{p.status === 'rejected' ? 'Send new proof' : 'Send payment proof'}</Button>}</Card>} /></>;
}
