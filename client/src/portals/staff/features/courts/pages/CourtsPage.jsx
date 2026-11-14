import { api } from '../../../../../shared/lib/api';
import CrudPage from '../../../../../shared/components/CrudPage';
import StatusBadge from '../../../../../shared/components/StatusBadge';
// Staff can edit court details and set maintenance. No prices, no add, no delete.
const fields = [{ name: 'name', label: 'Court name', required: true }, { name: 'type', label: 'Indoor or outdoor', options: ['indoor', 'outdoor'] }, { name: 'surface', label: 'Surface', placeholder: 'Acrylic' }, { name: 'status', label: 'Status', options: [{ value: 'available', label: 'Available' }, { value: 'maintenance', label: 'Maintenance (cannot be booked)' }, { value: 'closed', label: 'Closed' }], helper: 'Maintenance and closed courts cannot be booked.' }, { name: 'opens_at', label: 'Opens', type: 'time' }, { name: 'closes_at', label: 'Closes', type: 'time' }];
export default function CourtsPage() {
  return <CrudPage title="Courts" subtitle="Change court details or set maintenance." listPath="/api/staff/courts" search="Search courts" filters={[{ name: 'status', label: 'Status', options: ['available', 'maintenance', 'closed'].map(s => ({ value: s, label: s })) }]} fields={fields}
    toForm={c => ({ ...c, opens_at: String(c.opens_at).slice(0, 5), closes_at: String(c.closes_at).slice(0, 5) })} onUpdate={(c, f) => api.patch(`/api/staff/courts/${c.id}`, { name: f.name, type: f.type, surface: f.surface, status: f.status, opens_at: f.opens_at, closes_at: f.closes_at }).then(() => ({ message: 'Changes saved.' }))}
    empty={{ title: 'No courts yet', text: 'Ask the owner to add courts.' }} card={c => <div className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{c.name}</p><StatusBadge status={c.status} /></div><p className="muted capitalize">Court {c.court_number}, {c.type}{c.surface ? `, ${c.surface}` : ''}</p><p>Open {String(c.opens_at).slice(0, 5)} to {String(c.closes_at).slice(0, 5)}</p></div>} />;
}
