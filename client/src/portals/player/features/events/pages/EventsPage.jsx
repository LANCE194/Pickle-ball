import { useApi } from '../../../../../shared/hooks/useApi';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
import { apiUrl } from '../../../../../shared/lib/api';
export default function EventsPage() {
  const { data, loading, error, reload } = useApi('/api/player/events');
  return <><PageHeader title="Events" /><DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No events right now', text: 'News and events from the club will show here.' }}
    renderItem={e => <Card className="h-full">{e.image_path && <img src={apiUrl(`/api/files/${e.image_path}`)} alt="" className="rounded-card mb-2 w-full h-40 object-cover" loading="lazy" />}<div className="flex items-start justify-between gap-2"><h3>{e.title}</h3>{e.visibility === 'members' && <span className="text-sm rounded-full bg-volt text-navy px-2">Members</span>}</div>{e.date_label && <p className="muted">{e.date_label}</p>}<p className="mt-2 whitespace-pre-line">{e.body}</p></Card>} /></>;
}
