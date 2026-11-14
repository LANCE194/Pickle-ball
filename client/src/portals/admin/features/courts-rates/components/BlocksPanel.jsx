import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import Drawer from '../../../../../shared/components/Drawer';
import FormField from '../../../../../shared/components/FormField';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
import EmptyState from '../../../../../shared/components/EmptyState';
import { todayManila } from '../../../../../shared/lib/format';
const BASE = '/api/admin/courts-rates';
/** Blocked dates (maintenance, tournaments). Blocked times never show as bookable. */
export default function BlocksPanel({ courts }) {
  const toast = useToast(); const { data, reload } = useApi(`${BASE}/blocks`, null, { events: ['availability.changed'] }); const [open, setOpen] = useState(false); const [f, setF] = useState({}); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [del, setDel] = useState(null);
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const save = async () => { setBusy(true); setErr({}); try { await api.post(`${BASE}/${f.court_id}/blocks`, f); toast.ok('Dates blocked.'); setOpen(false); reload(); } catch (e) { setErr(e.fields || { court_id: e.message }); } finally { setBusy(false); } };
  return <section className="mt-8"><div className="flex items-center justify-between gap-2 mb-3"><h2>Blocked dates</h2><Button variant="secondary" onClick={() => { setF({ court_id: courts[0]?.id, date: todayManila(), start: '00:00', end: '23:59' }); setErr({}); setOpen(true); }}>Block dates</Button></div>
    {!data?.length ? <EmptyState title="No blocked dates" text="Block a court for repairs or a tournament so nobody can book it." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.map(b => <Card key={b.id} className="space-y-1"><p className="font-semibold">{b.court_label}</p><p>{b.date_label}, {b.time_label}</p>{b.reason && <p className="muted">{b.reason}</p>}<Button variant="ghost" onClick={() => setDel(b)}>Unblock</Button></Card>)}</div>}
    <Drawer open={open} onClose={() => setOpen(false)} title="Block dates" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Block these dates</Button></>}><div className="space-y-4">
      <FormField label="Court" name="court_id" options={courts.map(c => ({ value: c.id, label: `${c.name} (Court ${c.court_number})` }))} value={f.court_id} onChange={set} error={err.court_id} /><FormField label="First day" type="date" name="date" value={f.date} onChange={set} error={err.date} /><FormField label="Last day (optional)" type="date" name="endDate" value={f.endDate} onChange={set} /><FormField label="From" type="time" name="start" value={f.start} onChange={set} /><FormField label="Until" type="time" name="end" value={f.end} onChange={set} error={err.end} /><FormField label="Reason" name="reason" value={f.reason} onChange={set} placeholder="Floor repair" /></div></Drawer>
    <ConfirmDialog open={!!del} title="Unblock these dates?" text="The court can be booked again at those times." confirmLabel="Yes, unblock" cancelLabel="No, keep blocked" onCancel={() => setDel(null)} onConfirm={async () => { try { await api.del(`${BASE}/blocks/${del.id}`); toast.ok('Unblocked.'); reload(); } catch (e) { toast.error(e.message); } setDel(null); }} /></section>;
}
