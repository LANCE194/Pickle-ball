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
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
import EmptyState from '../../../../../shared/components/EmptyState';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import SitePreview from '../../../../../shared/components/SitePreview';
// SitePreview lives with the Admin designer; the Super Admin reads the same design JSON as a plain change summary + raw preview.
const B = '/api/super-admin/deployments';
export default function DeploymentsPage() {
  const toast = useToast(); const q = useApi(`${B}/queue`, null, { events: ['notification.new'] }); const h = useApi(`${B}/history`); const [prev, setPrev] = useState(null); const [act, setAct] = useState(null); const [note, setNote] = useState(''); const [rb, setRb] = useState(null); const [busy, setBusy] = useState(false);
  const run = async () => { if (['changes', 'reject'].includes(act.kind) && !note.trim()) return toast.error('Please write a reason.'); setBusy(true); try { await api.post(`${B}/${act.v.id}/${act.kind}`, { note }); toast.ok({ approve: 'Design approved. It is not live until you deploy it.', deploy: 'Approved design is live.', changes: 'Changes requested.', reject: 'Design rejected.' }[act.kind]); setAct(null); q.reload(); h.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const openPrev = async v => { try { const r = await api.get(`${B}/${v.id}/preview`); setPrev({ v, config: r.config, clubId: r.club_id }); } catch (e) { toast.error(e.message); } };
  const items = q.data || []; const waiting = items.filter(v => v.status === 'submitted'); const ready = items.filter(v => v.status === 'approved');
  const cards = (versions, action) => <div className="grid gap-3 sm:grid-cols-2">{versions.map(v => <Card key={v.id} className="space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold">{v.club_name} · Version {v.version_no}</p><StatusBadge status={v.status} /></div>{v.note && <p>Note: {v.note}</p>}<ul className="list-disc pl-5 text-sm">{v.change_summary.map(c => <li key={c}>{c}</li>)}</ul>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => openPrev(v)}>See the design</Button>{action(v)}</div></Card>)}</div>;
  return <><PageHeader title="Deployments" subtitle="Review, approve, and deploy club websites in separate steps." />
    <h2 className="mb-2">Waiting for review</h2>{q.loading ? <Skeleton /> : q.error ? <ErrorPanel error={q.error} onRetry={q.reload} /> : waiting.length ? cards(waiting, v => <><Button onClick={() => { setAct({ v, kind: 'approve' }); setNote(''); }}>Approve only</Button><Button variant="secondary" onClick={() => { setAct({ v, kind: 'changes' }); setNote(''); }}>Ask for changes</Button><Button variant="ghost" onClick={() => { setAct({ v, kind: 'reject' }); setNote(''); }}>Reject</Button></>) : <EmptyState title="Nothing to review" text="Submitted designs appear here before approval." />}
    <h2 className="mt-8 mb-2">Approved — ready to deploy</h2>{ready.length ? cards(ready, v => <Button onClick={() => { setAct({ v, kind: 'deploy' }); setNote(''); }}>Deploy approved design</Button>) : <p className="muted">Approved designs stay here until you deploy them.</p>}
    <h2 className="mt-8 mb-2">History</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(h.data || []).map(v => <Card key={v.id} className="space-y-1"><div className="flex justify-between gap-2"><p className="font-medium">{v.club_name || 'Default Club'} · Version {v.version_no}</p><StatusBadge status={v.status} /></div><p className="text-sm muted">{new Date(v.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>{v.note && <p className="text-sm">{v.note}</p>}{['archived', 'live'].includes(v.status) && <Button variant="ghost" onClick={() => setRb(v)}>Go back to this version</Button>}</Card>)}</div>
    <Drawer open={!!prev} onClose={() => setPrev(null)} title={prev ? `${prev.v.club_name} · Version ${prev.v.version_no}` : ''}>{prev && <div className="space-y-3"><p className="text-sm muted">Exactly how the public will see it. Switch your phone to dark mode to check dark.</p><SitePreview config={prev.config} clubId={prev.clubId} width="mobile" /><SitePreview config={prev.config} clubId={prev.clubId} width="desktop" /></div>}</Drawer>
    <ConfirmDialog open={!!act} danger={act?.kind === 'reject'} title={act ? { approve: 'Approve this design?', deploy: 'Deploy this approved design?', changes: 'Ask for changes', reject: 'Reject this design' }[act.kind] : ''} text={act?.kind === 'approve' ? 'Approval does not publish the site. Deployment is a separate action.' : act?.kind === 'deploy' ? 'This design will become the public live website for this club.' : 'The owner will see your reason.'} confirmLabel={act ? { approve: 'Approve only', deploy: 'Deploy now', changes: 'Send request', reject: 'Reject design' }[act.kind] : ''} cancelLabel="No, go back" loading={busy} onCancel={() => setAct(null)} onConfirm={run}><div className="mt-3"><FormField label={['changes', 'reject'].includes(act?.kind) ? 'Reason' : 'Note (optional)'} textarea value={note} onChange={e => setNote(e.target.value)} /></div></ConfirmDialog>
    <ConfirmDialog open={!!rb} title="Go back to this version?" text="It becomes the live design. Nothing is deleted, so you can move forward again." confirmLabel="Yes, go back" cancelLabel="No, keep current" onCancel={() => setRb(null)} onConfirm={async () => { try { const r = await api.post(`${B}/${rb.id}/rollback`); toast.ok(`Live design is now version ${r.version}.`); h.reload(); } catch (e) { toast.error(e.message); } setRb(null); }} /></>;
}
