import Card from '../../../../../shared/components/Card';
import DataList from '../../../../../shared/components/DataList';
import { useApi } from '../../../../../shared/hooks/useApi';
import { apiUrl } from '../../../../../shared/lib/api';
export default function EventsPage() {
  const { data, loading, error, reload } = useApi('/api/guest/events');
  return <div className="max-w-page mx-auto px-4 py-6"><h1 className="mb-4">Events</h1>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No events right now', text: 'When the club posts an event, it will show here.' }}
      renderItem={e => <Card className="h-full">{e.image_path && <img src={apiUrl(`/api/files/${e.image_path}`)} alt="" className="rounded-card mb-2 w-full h-40 object-cover" loading="lazy" />}<h3>{e.title}</h3>{e.date_label && <p className="muted">{e.date_label}</p>}<p className="mt-2 whitespace-pre-line">{e.body}</p></Card>} /></div>;
}
