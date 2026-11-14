import { api } from '../../lib/api';
import { useToast } from '../Toast';
import CrudPage from '../CrudPage';
import StatusBadge from '../StatusBadge';
export default function InquiriesView({ base }) {
  const toast = useToast();
  return <CrudPage title="Inquiries" subtitle="Messages from the website." listPath={base} filters={[{ name: 'handled', label: 'Show', options: [{ value: 'false', label: 'Not answered yet' }, { value: 'true', label: 'Answered' }] }]}
    empty={{ title: 'No messages yet', text: 'Messages from the website contact form will show here.' }}
    card={i => <div className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{i.name}</p><StatusBadge status={i.handled ? 'done' : 'new'} label={i.handled ? 'Answered' : 'New'} /></div><p>{i.contact}</p><p className="muted capitalize">{i.interest}{i.age_range ? `, ${i.age_range}` : ''}</p>{i.message && <p>{i.message}</p>}</div>}
    extraActions={(i, reload) => [{ label: i.handled ? 'Mark as not answered' : 'Mark as answered', onClick: async () => { try { await api.post(`${base}/${i.id}/handled`, { handled: !i.handled }); reload(); } catch (e) { toast.error(e.message); } } }]} />;
}
