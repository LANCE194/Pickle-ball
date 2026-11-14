import { useState } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import PageHeader from '../PageHeader';
import DataList from '../DataList';
import Card from '../Card';
import Button from '../Button';
import Drawer from '../Drawer';
import FormField from '../FormField';
import StatusBadge from '../StatusBadge';
import AuthImage from '../AuthImage';
/** Payment queue: thumbnail, amount, player, booking (date, time, court). Approve = 2 taps. Reject needs a reason. */
export default function PaymentQueueView({ base, title = 'Payment Queue', allowPaidAtCourt = false }) {
  const toast = useToast(); const [status, setStatus] = useState('open'); const [q, setQ] = useState(''); const { data, loading, error, reload } = useApi(base, { status, q }, { events: ['payment.queue'] });
  const [view, setView] = useState(null); const [rej, setRej] = useState(null); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const act = async (fn, ok) => { setBusy(true); try { const r = await fn(); toast.ok(r?.message || ok); setView(null); setRej(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const buttons = p => <div className="flex flex-wrap gap-2">{p.proof_url && <Button variant="secondary" onClick={() => setView(p)}>Open proof</Button>}
    {['pending_verification'].includes(p.status) && <><Button loading={busy} onClick={() => act(() => api.post(`${base}/${p.id}/approve`), 'Payment accepted.')}>Approve</Button><Button variant="ghost" onClick={() => { setRej(p); setReason(''); }}>Reject</Button></>}
    {p.status === 'pay_at_court_pending' && allowPaidAtCourt && <Button loading={busy} onClick={() => act(() => api.post(`${base}/${p.id}/paid-at-court`), 'Marked as paid.')}>Mark as paid</Button>}</div>;
  return <><PageHeader title={title} subtitle="Check each payment against the proof, then approve or reject." />
    <DataList items={data} loading={loading} error={error} onRetry={reload} search={{ placeholder: 'Search player or reference' }} onSearch={setQ} filters={[{ name: 'status', label: 'Show', options: [{ value: 'open', label: 'Needs action' }, { value: 'pending_verification', label: 'Waiting for check' }, { value: 'approved', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }, { value: '', label: 'Everything' }] }]} values={{ status }} onFilter={(k, v) => setStatus(v)}
      empty={{ title: 'Nothing to check right now', text: 'New payment proofs will show here as players send them.' }}
      renderItem={p => <Card className="h-full space-y-2"><div className="flex gap-3">{p.proof_url ? <AuthImage path={p.proof_url} alt="Payment proof thumbnail" className="h-20 w-20 rounded-card object-cover shrink-0" /> : <div className="h-20 w-20 rounded-card bg-slate-dn/20 shrink-0" />}<div className="min-w-0"><p className="text-xl font-bold">{p.amount_label}</p><p className="font-medium truncate">{p.player_name}</p><p className="text-sm muted">{p.for}</p></div></div>
        {p.schedule_line && <p>{p.schedule_line}</p>}<p className="text-sm muted">Ref {p.reference_code}{p.proof_reference_no ? `, receipt ${p.proof_reference_no}` : ''} - {p.created_label}</p><StatusBadge status={p.status} />{p.reject_reason && <p className="text-alert text-sm">Reason: {p.reject_reason}</p>}{buttons(p)}</Card>} />
    <Drawer open={!!view} onClose={() => setView(null)} title="Payment proof" footer={view && ['pending_verification'].includes(view.status) ? <><Button variant="ghost" onClick={() => { setRej(view); setReason(''); }}>Reject</Button><Button loading={busy} onClick={() => act(() => api.post(`${base}/${view.id}/approve`), 'Payment accepted.')}>Approve</Button></> : null}>
      {view && <div className="space-y-3"><AuthImage path={view.proof_url} alt="Payment proof" className="w-full rounded-card" /><p className="text-xl font-bold">{view.amount_label}</p><p>{view.player_name}</p>{view.schedule_line && <p>{view.schedule_line}</p>}<p className="muted">Reference {view.reference_code}. Receipt no. {view.proof_reference_no || '-'}</p></div>}</Drawer>
    <Drawer open={!!rej} onClose={() => setRej(null)} title="Reject payment" footer={<><Button variant="secondary" onClick={() => setRej(null)}>Go back</Button><Button variant="danger" loading={busy} onClick={() => (reason.trim() ? act(() => api.post(`${base}/${rej.id}/reject`, { reason }), 'Payment rejected.') : toast.error('Please write the reason so the player knows what to fix.'))}>Reject payment</Button></>}>
      <FormField label="Reason" textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: the amount is lower than the price" helper="The player sees this and can send new proof." /></Drawer></>;
}
