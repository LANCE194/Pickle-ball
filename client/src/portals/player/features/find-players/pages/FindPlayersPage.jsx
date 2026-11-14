import { useState } from 'react';
import { Plus } from '../../../../../shared/lib/icons';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import Drawer from '../../../../../shared/components/Drawer';
import FormField from '../../../../../shared/components/FormField';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
import { todayManila } from '../../../../../shared/lib/format';
const LEVELS = [{ value: '1.5', label: 'Beginner (1.0 - 2.5)' }, { value: '3.2', label: 'Intermediate (3.0 - 3.5)' }, { value: '4.2', label: 'Advanced (4.0 - 4.5)' }, { value: '5.2', label: 'Pro (5.0+)' }];
export default function FindPlayersPage() {
  const toast = useToast(); const [fv, setFv] = useState({ date: '', level: '' }); const { data, loading, error, reload } = useApi('/api/player/find-players', fv, { events: ['openplay.changed', 'notification.new'] });
  const sug = useApi('/api/player/find-players/suggestions', null, { events: ['openplay.changed'] }); const courts = useApi('/api/guest/courts-rates');
  const [open, setOpen] = useState(false); const [f, setF] = useState({ date: todayManila(), start_time: '18:00', hours: 2, format: 'doubles', spots_needed: 3 }); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [leave, setLeave] = useState(null);
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const act = async (fn, ok) => { try { const r = await fn(); toast.ok(r?.message || ok); reload(); sug.reload(); } catch (e) { toast.error(e.message); } };
  const post = async () => { setBusy(true); setErr({}); try { await api.post('/api/player/find-players', { ...f, hours: Number(f.hours), spots_needed: Number(f.spots_needed), court_id: f.court_id || null }); toast.ok('Your game is posted.'); setOpen(false); reload(); sug.reload(); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  return <><PageHeader title="Find Players" subtitle="Join an open game near your level, or post your own." action={{ label: 'Post a game', icon: Plus, onClick: () => setOpen(true) }} />
    {sug.data?.post && sug.data.players.length > 0 && <Card className="mb-4"><h2>Players who could join your game</h2><p className="muted">Similar level and free at your game time.</p><ul className="mt-2 flex flex-wrap gap-2">{sug.data.players.map(p => <li key={p.id} className="rounded-full border line px-3 py-1">{p.name} ({Number(p.rating).toFixed(1)})</li>)}</ul></Card>}
    <DataList items={data} loading={loading} error={error} onRetry={reload} filters={[{ name: 'level', label: 'Level', options: LEVELS }]} values={fv} onFilter={(k, v) => setFv(s => ({ ...s, [k]: v }))}
      empty={{ title: 'No open games yet', text: 'Post a game and other players can ask to join.', actionLabel: 'Post a game', onAction: () => setOpen(true) }}
      renderItem={g => <Card className="h-full space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold text-lg">{g.date_label}</p><StatusBadge status={g.status} /></div><p>{g.time_label}</p><p>{g.court_label}</p><p className="capitalize">{g.format}, level {g.level_min} to {g.level_max}</p><p className="muted">Host: {g.host_name}. {g.spots_left} spot{g.spots_left === 1 ? '' : 's'} left. {g.cost_label}.</p>{g.notes && <p>{g.notes}</p>}
        {g.is_host ? <div className="space-y-2">{g.requests.map(r => <div key={r.player_id} className="rounded-card border line p-2"><p>{r.name} ({Number(r.rating).toFixed(1)}){r.needs_host_approval && <span className="text-clay"> - outside your level range</span>}</p><div className="flex gap-2 mt-1"><Button variant="primary" onClick={() => act(() => api.post(`/api/player/find-players/${g.id}/members/${r.player_id}`, { decision: 'confirm' }), 'Confirmed.')}>Confirm</Button><Button variant="ghost" onClick={() => act(() => api.post(`/api/player/find-players/${g.id}/members/${r.player_id}`, { decision: 'decline' }), 'Declined.')}>Decline</Button></div></div>)}
            <div className="flex flex-wrap gap-2">{g.court_id && <Button variant="secondary" onClick={() => act(() => api.post(`/api/player/find-players/${g.id}/book`), 'Court held.')}>Book the court</Button>}<Button variant="ghost" onClick={() => act(() => api.post(`/api/player/find-players/${g.id}/cancel`), 'Game cancelled.')}>Cancel my game</Button></div></div>
          : g.my_status === 'confirmed' || g.my_status === 'requested' ? <div className="flex items-center gap-2"><StatusBadge status={g.my_status === 'confirmed' ? 'accepted' : 'requested'} label={g.my_status === 'confirmed' ? 'You are in' : 'Waiting for the host'} /><Button variant="ghost" onClick={() => setLeave(g)}>Leave</Button></div>
          : <div>{!g.in_my_level && <p className="text-sm text-clay mb-1">Outside your level. The host must approve.</p>}<Button variant="primary" disabled={g.spots_left === 0} onClick={() => act(() => api.post(`/api/player/find-players/${g.id}/join`), 'Request sent.')}>Ask to join</Button></div>}</Card>} />
    <Drawer open={open} onClose={() => setOpen(false)} title="Post a game" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={post}>Post my game</Button></>}><div className="space-y-4">
      <FormField label="Day" type="date" name="date" min={todayManila()} value={f.date} onChange={set} error={err.date} /><FormField label="Start time" type="time" name="start_time" value={f.start_time} onChange={set} error={err.start_time} /><FormField label="How many hours?" name="hours" options={['1', '2', '3']} value={String(f.hours)} onChange={set} />
      <FormField label="Court (optional)" name="court_id" options={(courts.data || []).map(c => ({ value: c.id, label: c.label }))} placeholder="Decide later" value={f.court_id} onChange={set} /><FormField label="Format" name="format" options={['singles', 'doubles', 'mixed']} value={f.format} onChange={set} />
      <FormField label="Lowest level" name="level_min" type="number" step="0.5" placeholder="Leave empty for near my level" value={f.level_min} onChange={set} /><FormField label="Highest level" name="level_max" type="number" step="0.5" value={f.level_max} onChange={set} />
      <FormField label="Players you still need" name="spots_needed" type="number" min={1} max={11} value={f.spots_needed} onChange={set} error={err.spots_needed} /><FormField label="Cost per player (optional)" name="cost_split" type="number" placeholder="For example 150" value={f.cost_split} onChange={set} /><FormField label="Notes" name="notes" textarea value={f.notes} onChange={set} placeholder="Bring your own paddle" /></div></Drawer>
    <ConfirmDialog open={!!leave} danger title="Leave this game?" text="The host will be told and your spot will open for someone else." confirmLabel="Yes, leave" cancelLabel="No, stay" onCancel={() => setLeave(null)} onConfirm={() => { act(() => api.post(`/api/player/find-players/${leave.id}/leave`), 'You left the game.'); setLeave(null); }} /></>;
}
