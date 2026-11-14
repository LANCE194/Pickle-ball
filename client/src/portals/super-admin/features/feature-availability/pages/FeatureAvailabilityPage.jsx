import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import Drawer from '../../../../../shared/components/Drawer';
import FormField from '../../../../../shared/components/FormField';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
const B = '/api/super-admin/feature-availability';
const STATUSES = ['new', 'reviewing', 'accepted', 'in_progress', 'done', 'declined'];
export default function FeatureAvailabilityPage() {
  const toast = useToast(); const f = useApi(B, null, { events: ['features.changed'] }); const r = useApi(`${B}/requests`, null, { events: ['notification.new'] }); const [tab, setTab] = useState('features'); const [ed, setEd] = useState(null);
  const set = async (k, body) => { try { await api.patch(`${B}/${k}`, body); f.reload(); } catch (e) { toast.error(e.message); } };
  return <><PageHeader title="Features" subtitle="Decide which features the club may use, and answer feature requests." />
    <div className="flex gap-2 mb-4"><Button variant={tab === 'features' ? 'primary' : 'secondary'} onClick={() => setTab('features')}>Availability</Button><Button variant={tab === 'requests' ? 'primary' : 'secondary'} onClick={() => setTab('requests')}>Requests ({(r.data || []).filter(x => ['new', 'reviewing'].includes(x.status)).length})</Button></div>
    {tab === 'features' && (f.loading ? <Skeleton lines={5} /> : f.error ? <ErrorPanel error={f.error} onRetry={f.reload} /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{f.data.map(x => <Card key={x.key} className="space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold">{x.label}</p><StatusBadge status={x.is_core ? 'live' : x.available ? 'active' : 'inactive'} label={x.is_core ? 'Core (always on)' : x.available ? 'Available' : 'Not available'} /></div><p className="muted">{x.description}</p><p className="text-sm">Key: {x.key}{x.requires.length ? ` - needs ${x.requires.join(', ')}` : ''}</p>
      {!x.is_core && <div className="flex flex-wrap gap-2"><Button variant={x.available ? 'secondary' : 'primary'} onClick={() => set(x.key, { available: !x.available })}>{x.available ? 'Make unavailable' : 'Make available'}</Button><Button variant="ghost" onClick={() => set(x.key, { locked: !x.locked })}>{x.locked ? 'Unlock' : 'Lock'}</Button></div>}</Card>)}</div>)}
    {tab === 'requests' && (r.loading ? <Skeleton /> : !r.data.length ? <p className="muted">No requests yet.</p> : <div className="grid gap-3 sm:grid-cols-2">{r.data.map(x => <Card key={x.id} className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{x.title}</p><StatusBadge status={x.status} /></div><p>{x.description}</p><p className="text-sm muted capitalize">{x.type}, {x.priority} priority, from {x.requested_by_name}</p>{x.status_note && <p className="text-sm">Note: {x.status_note}</p>}<Button variant="secondary" onClick={() => setEd({ ...x })}>Answer</Button></Card>)}</div>)}
    <Drawer open={!!ed} onClose={() => setEd(null)} title="Answer request" footer={<><Button variant="secondary" onClick={() => setEd(null)}>Cancel</Button><Button onClick={async () => { try { await api.patch(`${B}/requests/${ed.id}`, { status: ed.status, note: ed.status_note }); toast.ok('Answer sent.'); setEd(null); r.reload(); } catch (e) { toast.error(e.message); } }}>Send answer</Button></>}>{ed && <div className="space-y-4"><p className="font-medium">{ed.title}</p><FormField label="Status" options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }))} value={ed.status} onChange={e => setEd(s => ({ ...s, status: e.target.value }))} /><FormField label="Note for the owner" textarea value={ed.status_note || ''} onChange={e => setEd(s => ({ ...s, status_note: e.target.value }))} /></div>}</Drawer></>;
}
