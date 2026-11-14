import { api, apiUrl } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import CrudPage from '../../../../../shared/components/CrudPage';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import { peso } from '../../../../../shared/lib/format';
import BlocksPanel from '../components/BlocksPanel';
const B = '/api/admin/courts-rates';
const fields = [{ name: 'name', label: 'Court name', required: true, placeholder: 'Court 1 - Indoor' }, { name: 'court_number', label: 'Court number', type: 'number', required: true, helper: 'Each court needs its own number.' }, { name: 'type', label: 'Indoor or outdoor', options: ['indoor', 'outdoor'] }, { name: 'surface', label: 'Surface' }, { name: 'offpeak_rate', label: 'Off-peak price per hour (PHP)', type: 'number' }, { name: 'peak_rate', label: 'Peak price per hour (PHP)', type: 'number', helper: 'Peak is 5 PM to 9 PM on weekdays and all day on weekends. New prices only apply to new bookings.' }, { name: 'hourly_rate', label: 'Standard price per hour (PHP)', type: 'number' }, { name: 'status', label: 'Status', options: [{ value: 'available', label: 'Available' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'closed', label: 'Closed' }] }, { name: 'opens_at', label: 'Opens', type: 'time' }, { name: 'closes_at', label: 'Closes', type: 'time' }, { name: 'peak_start', label: 'Peak starts', type: 'time' }, { name: 'peak_end', label: 'Peak ends', type: 'time' }];
export default function CourtsRatesPage() {
  const toast = useToast(); const list = useApi(B, null, { events: ['availability.changed'] });
  const t = v => (v ? String(v).slice(0, 5) : v);
  const pick = (c, f) => ({ ...f, opens_at: t(f.opens_at), closes_at: t(f.closes_at), peak_start: t(f.peak_start), peak_end: t(f.peak_end) });
  return <><CrudPage title="Courts and Rates" listPath={B} search="Search courts" filters={[{ name: 'status', label: 'Status', options: ['available', 'maintenance', 'closed'].map(s => ({ value: s, label: s })) }]} createLabel="Add a court" fields={fields} initial={{ type: 'indoor', status: 'available', opens_at: '06:00', closes_at: '22:00', peak_start: '17:00', peak_end: '21:00', offpeak_rate: 300, peak_rate: 400, hourly_rate: 300 }}
    toForm={c => ({ ...c, opens_at: t(c.opens_at), closes_at: t(c.closes_at), peak_start: t(c.peak_start), peak_end: t(c.peak_end) })} events={['availability.changed']}
    onCreate={f => api.post(B, f).then(() => ({ message: 'Court added.' }))} onUpdate={(c, f) => api.patch(`${B}/${c.id}`, f).then(() => ({ message: 'Changes saved.' }))}
    archive={{ label: 'Remove from list', title: 'Remove this court?', text: 'Players will no longer see it. Upcoming bookings must be moved first. You can bring it back later.', run: c => api.post(`${B}/${c.id}/archive`).then(() => ({ message: 'Court removed from the list.' })), undo: c => api.post(`${B}/${c.id}/restore`) }}
    empty={{ title: 'No courts yet', text: 'Add your first court with a name, a number and prices.' }}
    extraActions={(c, reload) => [{ label: c.photo_path ? 'Change photo' : 'Add photo', onClick: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/jpeg,image/png'; i.onchange = async () => { const f = i.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) return toast.error('That picture is too big. Use one under 5 MB.'); const fd = new FormData(); fd.append('file', f); try { await api.upload(`${B}/${c.id}/photo`, fd); toast.ok('Photo saved.'); reload(); } catch (e) { toast.error(e.message); } }; i.click(); } }]}
    card={c => <div className="space-y-1">{c.photo_path && <img src={apiUrl(`/api/files/${c.photo_path}`)} alt={c.name} className="rounded-card w-full h-32 object-cover" loading="lazy" />}<div className="flex justify-between gap-2"><p className="font-semibold">{c.name}</p><StatusBadge status={c.status} /></div><p className="muted capitalize">Court {c.court_number}, {c.type}{c.surface ? `, ${c.surface}` : ''}</p><p>Off-peak {peso(c.offpeak_rate)}, peak {peso(c.peak_rate)}</p><p className="muted">Open {t(c.opens_at)} to {t(c.closes_at)}</p></div>} />
    <div className="no-print"><BlocksPanel courts={list.data || []} /></div></>;
}
