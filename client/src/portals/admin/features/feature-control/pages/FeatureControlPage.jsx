import { useEffect, useState } from 'react';
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
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
const B = '/api/admin/feature-control';
/** Switches as cards grouped by area, with plain descriptions, dependency notes and a Request a Feature button. */
export default function FeatureControlPage() {
  const toast = useToast(); const { data, loading, error, reload } = useApi(B, null, { events: ['features.changed'] }); const reqs = useApi(`${B}/requests`, null, { events: ['notification.new'] }); const wiz = useApi(`${B}/wizard`);
  const [ask, setAsk] = useState(null); const [reqOpen, setReqOpen] = useState(false); const [rf, setRf] = useState({ type: 'new feature', priority: 'normal' }); const [rerr, setRerr] = useState({}); const [wOpen, setWOpen] = useState(false); const [pick, setPick] = useState({});
  useEffect(() => { if (wiz.data && !wiz.data.done) { setPick(Object.fromEntries(wiz.data.features.filter(f => f.available && !f.locked).map(f => [f.key, f.enabled]))); setWOpen(true); } }, [wiz.data]);
  const label = k => data?.find(f => f.key === k)?.label || k;
  const toggle = async (f, cascade = false) => { try { await api.post(`${B}/${f.key}`, { enabled: !f.enabled, cascade }); toast.ok(`${f.label} is now ${f.enabled ? 'off' : 'on'}.`); setAsk(null); reload(); } catch (e) { if (e.code === 'NEEDS_CONFIRM') setAsk({ f, keys: e.needs || e.dependents, on: !f.enabled }); else { toast.error(e.message); setAsk(null); } } };
  const send = async () => { setRerr({}); try { await api.post(`${B}/requests`, rf); toast.ok('Request sent to the Super Admin.'); setReqOpen(false); reqs.reload(); } catch (e) { setRerr(e.fields || {}); if (!e.fields) toast.error(e.message); } };
  const finishWizard = async () => { try { await api.post(`${B}/wizard`, { enabled: Object.keys(pick).filter(k => pick[k]) }); toast.ok('Your club is set up.'); setWOpen(false); reload(); } catch (e) { toast.error(e.message); } };
  if (loading) return <Skeleton lines={6} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  const areas = [...new Set(data.map(f => f.area))];
  return <><PageHeader title="Feature Control" subtitle="Choose what your club uses. Turning a feature off hides it but keeps all its data." action={{ label: 'Request a feature', onClick: () => { setRf({ type: 'new feature', priority: 'normal' }); setRerr({}); setReqOpen(true); } }} />
    <div className="space-y-6">{areas.map(a => <section key={a}><h2 className="mb-2">{a}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.filter(f => f.area === a).map(f => <Card key={f.key} className="space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold">{f.label}</p><StatusBadge status={f.core ? 'live' : f.enabled ? 'active' : 'inactive'} label={f.status_text} /></div><p className="muted">{f.description}</p>{f.requires.length > 0 && <p className="text-sm">Needs: {f.requires.map(label).join(', ')}</p>}
      {f.core ? null : !f.available || f.locked ? <Button variant="secondary" onClick={() => { setRf({ type: 'unlock', priority: 'normal', title: `Please unlock: ${f.label}`, description: '' }); setRerr({}); setReqOpen(true); }}>Ask to unlock</Button> : <Button variant={f.enabled ? 'secondary' : 'primary'} onClick={() => toggle(f)}>{f.enabled ? 'Turn off' : 'Turn on'}</Button>}</Card>)}</div></section>)}</div>
    <section className="mt-8"><h2 className="mb-2">My requests</h2>{!reqs.data?.length ? <p className="muted">You have not sent any requests.</p> : <div className="grid gap-3 sm:grid-cols-2">{reqs.data.map(r => <Card key={r.id}><div className="flex justify-between gap-2"><p className="font-medium">{r.title}</p><StatusBadge status={r.status} /></div><p className="muted">{r.description}</p>{r.status_note && <p className="text-sm">Answer: {r.status_note}</p>}</Card>)}</div>}</section>
    <ConfirmDialog open={!!ask} title={ask?.on ? 'Turn on other features too?' : 'This will turn off other features'} text={ask ? `${ask.on ? 'These are needed first' : 'These depend on it'}: ${ask.keys.map(label).join(', ')}.` : ''} confirmLabel={ask?.on ? 'Yes, turn them all on' : 'Yes, turn them all off'} cancelLabel="No, go back" onCancel={() => setAsk(null)} onConfirm={() => toggle(ask.f, true)} />
    <Drawer open={reqOpen} onClose={() => setReqOpen(false)} title="Request a feature" footer={<><Button variant="secondary" onClick={() => setReqOpen(false)}>Cancel</Button><Button onClick={send}>Send request</Button></>}><div className="space-y-4"><FormField label="Short title" value={rf.title} onChange={e => setRf(s => ({ ...s, title: e.target.value }))} error={rerr.title} /><FormField label="What do you need?" textarea value={rf.description} onChange={e => setRf(s => ({ ...s, description: e.target.value }))} error={rerr.description} /><FormField label="Kind of request" options={[{ value: 'new feature', label: 'A new feature' }, { value: 'change', label: 'A change to something' }, { value: 'unlock', label: 'Unlock a feature' }]} value={rf.type} onChange={e => setRf(s => ({ ...s, type: e.target.value }))} /><FormField label="How important?" options={[{ value: 'low', label: 'Can wait' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'Important' }]} value={rf.priority} onChange={e => setRf(s => ({ ...s, priority: e.target.value }))} /></div></Drawer>
    <Drawer open={wOpen} onClose={() => setWOpen(false)} title="Set up your club" footer={<Button onClick={finishWizard}>Finish setup</Button>}><div className="space-y-3"><p>Choose the features your club will use. You can change this any time.</p>{(wiz.data?.features || []).filter(f => f.available && !f.locked).map(f => <FormField key={f.key} type="checkbox" label={f.label} helper={f.description} value={!!pick[f.key]} onChange={e => setPick(s => ({ ...s, [f.key]: e.target.value }))} />)}</div></Drawer></>;
}
