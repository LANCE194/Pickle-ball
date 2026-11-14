import { Link } from 'react-router-dom';
import Card from '../../../../../shared/components/Card';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import DataList from '../../../../../shared/components/DataList';
import Button from '../../../../../shared/components/Button';
import { useApi } from '../../../../../shared/hooks/useApi';
export default function PublicTournamentsPage({ onBook }) {
  const { data, loading, error, reload } = useApi('/api/guest/public-tournaments', null, { events: ['tournament.changed', 'bracket.changed', 'score.updated'] });
  return <div className="max-w-page mx-auto px-4 py-6"><h1 className="mb-4">Tournaments</h1>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No tournaments right now', text: 'Upcoming tournaments will show here.' }}
      renderItem={t => <Card className="h-full space-y-2"><div className="flex items-start justify-between gap-2"><h3>{t.name}</h3><StatusBadge status={t.status} /></div><p>{t.starts_label} to {t.ends_label}</p><p className="muted capitalize">{t.category}, {t.format.replace(/_/g, ' ')}</p><p>Entry fee: {t.fee_label}</p><p>{t.approved_count} of {t.max_slots} slots filled</p>
        <div className="flex gap-2 flex-wrap"><Link to={`/tournaments/${t.id}`} className="min-h-tap inline-flex items-center underline">See bracket and standings</Link>{t.status === 'registration_open' && <Button variant="book" onClick={onBook}>Join</Button>}</div></Card>} /></div>;
}
