import Card from '../../../../../shared/components/Card';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import DataList from '../../../../../shared/components/DataList';
import { useApi } from '../../../../../shared/hooks/useApi';
import { apiUrl } from '../../../../../shared/lib/api';
export default function CourtsRatesPage() {
  const { data, loading, error, reload } = useApi('/api/guest/courts-rates', null, { events: ['availability.changed'] });
  return <div className="max-w-page mx-auto px-4 py-6"><h1 className="mb-4">Courts and Rates</h1>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No courts yet', text: 'Courts will show here once the club adds them.' }}
      renderItem={c => <Card className="h-full space-y-2">{c.photo_path && <img src={apiUrl(`/api/files/${c.photo_path}`)} alt={c.label} className="rounded-card w-full h-40 object-cover" loading="lazy" />}<div className="flex items-start justify-between gap-2"><h3>{c.label}</h3><StatusBadge status={c.status} /></div>
        <p className="muted capitalize">{c.type}{c.surface ? `, ${c.surface}` : ''}</p><p>Off-peak: <strong>{c.offpeak_label}</strong> per hour</p><p>Peak: <strong>{c.peak_label}</strong> per hour</p><p className="text-sm muted">Peak is {c.peak_start?.slice(0, 5)} to {c.peak_end?.slice(0, 5)} on weekdays and all day on weekends.</p></Card>} /></div>;
}
