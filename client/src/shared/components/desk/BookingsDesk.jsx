import { useState } from 'react';
import { Plus } from '../../lib/icons';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useFeature } from '../../hooks/useFeature';
import { useToast } from '../Toast';
import PageHeader from '../PageHeader';
import DataList from '../DataList';
import Card from '../Card';
import Button from '../Button';
import Drawer from '../Drawer';
import FormField from '../FormField';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';
import { todayManila, addDays, dayLabel, fmtTime } from '../../lib/format';
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const hourOf = iso => Number(new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false }).slice(0, 2));
const manilaIso = (date, hour) => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+08:00`).toISOString();
/** Front desk bookings: day/week/month view, drag-and-drop move with conflict check, walk-in, weekly repeat, cancel with reason. */
export default function BookingsDesk({ base, playersPath }) {
  const toast = useToast(); const recurringOn = useFeature('recurring_bookings');
  const [date, setDate] = useState(todayManila()); const [range, setRange] = useState('day'); const [court, setCourt] = useState(''); const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi(base, { date, range, court, q, status }, { events: ['booking.changed', 'availability.changed'] });
  const courts = useApi(`${base}/slots`, { date }, { events: ['availability.changed'] });
  const [walk, setWalk] = useState(false); const [f, setF] = useState({}); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [cancel, setCancel] = useState(null); const [reason, setReason] = useState(''); const [move, setMove] = useState(null); const [mf, setMf] = useState({}); const [pq, setPq] = useState('');
  const pl = useApi(playersPath, { q: pq }, { enabled: walk && pq.length > 1 });
  const courtList = courts.data?.courts || []; const opts = courtList.map(c => ({ value: c.court.id, label: `${c.court.name} (Court ${c.court.court_number})` }));
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value })); const run = async (fn, ok) => { setBusy(true); setErr({}); try { const r = await fn(); toast.ok(r?.message || ok); reload(); return true; } catch (e) { setErr(e.fields || {}); toast.error(e.alternatives?.length ? `${e.message} Free: ${e.alternatives.slice(0, 3).map(a => `${a.court} ${a.label}`).join('; ')}` : e.message); return false; } finally { setBusy(false); } };
  const startOf = () => manilaIso(f.date || date, Number(f.hour ?? 8));
  const save = async () => { const body = { court_id: f.court_id, start: startOf(), hours: Number(f.hours) || 1, player_id: f.player_id, guest_name: f.guest_name, players_count: Number(f.players_count) || 2, weeks: Number(f.weeks) || 4 }; if (await run(() => (f.repeat ? api.post(`${base}/recurring`, body) : api.post(`${base}/walk-in`, body)), 'Booking added.')) setWalk(false); };
  const drop = async (b, courtId, hour) => { await run(() => api.patch(`${base}/${b.id}/move`, { court_id: courtId, start: manilaIso(tzDate(b.starts_at), hour) }), 'Booking moved.'); };
  const tzDate = iso => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const bookings = data?.bookings || []; const active = bookings.filter(b => ['pending', 'confirmed', 'completed'].includes(b.status));
  const groups = bookings.reduce((a, b) => { (a[b.date_label] ||= []).push(b); return a; }, {});
  const card = b => <Card key={b.id} className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{b.date_label}, {b.time_label}</p><StatusBadge status={b.status} /></div><p>{b.court_label}</p><p className="muted">{b.player_name || b.notes || 'Guest'} - {b.price_label}{b.payment_status ? ` - ${b.payment_status.replace(/_/g, ' ')}` : ''}</p>
    {['pending', 'confirmed'].includes(b.status) && <div className="flex gap-2 flex-wrap pt-1"><Button variant="secondary" onClick={() => { setMove(b); setMf({ court_id: b.court_id, date: tzDate(b.starts_at), hour: hourOf(b.starts_at) }); }}>Move</Button><Button variant="ghost" onClick={() => { setCancel(b); setReason(''); }}>Cancel booking</Button></div>}</Card>;
  return <><PageHeader title="Bookings" action={{ label: 'Add walk-in booking', icon: Plus, onClick: () => { setF({ date, hour: 8, hours: 1, court_id: opts[0]?.value }); setErr({}); setPq(''); setWalk(true); } }} />
    <div className="flex flex-wrap gap-2 mb-3">{['day', 'week', 'month'].map(r => <Button key={r} variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>{{ day: 'Day', week: 'Week', month: 'Month' }[r]}</Button>)}
      <Button variant="ghost" onClick={() => setDate(addDays(date, range === 'day' ? -1 : range === 'week' ? -7 : -30))}>Back</Button><span className="min-h-tap inline-flex items-center font-semibold">{dayLabel(date)}</span><Button variant="ghost" onClick={() => setDate(addDays(date, range === 'day' ? 1 : range === 'week' ? 7 : 30))}>Next</Button><Button variant="ghost" onClick={() => setDate(todayManila())}>Today</Button></div>
    {range === 'day' && !loading && courtList.length > 0 && <Card className="hidden md:block mb-4 overflow-x-auto"><p className="text-sm muted mb-2">Drag a booking to another time or court to move it.</p>
      <div className="min-w-[900px]"><div className="grid" style={{ gridTemplateColumns: `140px repeat(${HOURS.length}, 1fr)` }}><div />{HOURS.map(h => <div key={h} className="text-xs text-center muted">{fmtTime(manilaIso(date, h)).replace(':00', '')}</div>)}</div>
        {courtList.map(c => <div key={c.court.id} className="grid relative border-t line" style={{ gridTemplateColumns: `140px repeat(${HOURS.length}, 1fr)`, minHeight: 48 }}><div className="py-3 font-medium text-sm">{c.court.name}</div>
          {HOURS.map(h => <div key={h} onDragOver={e => e.preventDefault()} onDrop={e => { const id = e.dataTransfer.getData('text/plain'); const b = bookings.find(x => x.id === id); if (b) drop(b, c.court.id, h); }} className="border-l line" />)}
          {active.filter(b => b.court_id === c.court.id).map(b => <div key={b.id} draggable={['pending', 'confirmed'].includes(b.status)} onDragStart={e => e.dataTransfer.setData('text/plain', b.id)} title={`${b.time_label} ${b.player_name || ''}`} className={`absolute top-1 bottom-1 rounded-card px-2 text-xs overflow-hidden cursor-grab ${b.status === 'pending' ? 'bg-clay text-navy' : 'bg-court text-white'}`} style={{ left: `calc(140px + (100% - 140px) * ${(hourOf(b.starts_at) - 6) / HOURS.length})`, width: `calc((100% - 140px) * ${b.duration_hours / HOURS.length} - 2px)` }}>{b.player_name || b.notes || 'Guest'}</div>)}</div>)}</div></Card>}
    <DataList items={Object.keys(groups).length ? [{ id: 'g' }] : []} loading={loading} error={error} onRetry={reload} onSearch={setQ} search={{ placeholder: 'Search by player name' }} filters={[{ name: 'court', label: 'Court', options: opts }, { name: 'status', label: 'Status', options: ['pending', 'confirmed', 'cancelled', 'expired', 'completed'].map(s => ({ value: s, label: s })) }]} values={{ court, status }} onFilter={(k, v) => (k === 'court' ? setCourt(v) : setStatus(v))} columns="grid-cols-1"
      empty={{ title: 'No bookings in this time', text: 'Add a walk-in booking to start.', actionLabel: 'Add walk-in booking', onAction: () => { setF({ date, hour: 8, hours: 1, court_id: opts[0]?.value }); setWalk(true); } }}
      renderItem={() => <div className="space-y-4">{Object.entries(groups).map(([d, list]) => <section key={d}><h3 className="mb-2">{d}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(card)}</div></section>)}</div>} />
    <Drawer open={walk} onClose={() => setWalk(false)} title="Add walk-in booking" footer={<><Button variant="secondary" onClick={() => setWalk(false)}>Cancel</Button><Button loading={busy} onClick={save}>{f.repeat ? 'Add weekly bookings' : 'Add booking'}</Button></>}><div className="space-y-4">
      <FormField label="Court" name="court_id" options={opts} value={f.court_id} onChange={set} error={err.court_id} /><FormField label="Day" type="date" name="date" value={f.date} onChange={set} /><FormField label="Start hour (24-hour, 6 to 21)" type="number" name="hour" min={6} max={21} value={f.hour} onChange={set} error={err.start} helper="For example 17 means 5:00 PM." /><FormField label="How many hours?" name="hours" options={['1', '2', '3']} value={String(f.hours || 1)} onChange={set} />
      <FormField label="Find a player" value={pq} onChange={e => setPq(e.target.value)} placeholder="Type a name" helper="Or type a guest name below." />{(pl.data || []).slice(0, 5).map(p => <Button key={p.id} full variant={f.player_id === p.id ? 'primary' : 'secondary'} onClick={() => setF(s => ({ ...s, player_id: p.id, guest_name: '' }))}>{p.first_name} {p.last_name}</Button>)}
      <FormField label="Guest name (if not a player)" name="guest_name" value={f.guest_name} onChange={set} error={err.guest_name} />
      {recurringOn && <><FormField type="checkbox" label="Repeat every week" value={f.repeat} onChange={e => setF(s => ({ ...s, repeat: e.target.value }))} />{f.repeat && <FormField label="For how many weeks?" type="number" name="weeks" min={2} max={26} value={f.weeks || 4} onChange={set} />}</>}</div></Drawer>
    <Drawer open={!!move} onClose={() => setMove(null)} title="Move booking" footer={<><Button variant="secondary" onClick={() => setMove(null)}>Cancel</Button><Button loading={busy} onClick={async () => { if (await run(() => api.patch(`${base}/${move.id}/move`, { court_id: mf.court_id, start: manilaIso(mf.date, Number(mf.hour)) }), 'Booking moved.')) setMove(null); }}>Move booking</Button></>}>
      {move && <div className="space-y-4"><p className="font-medium">{move.date_label}, {move.time_label}, {move.court_label}</p><FormField label="Court" options={opts} value={mf.court_id} onChange={e => setMf(s => ({ ...s, court_id: e.target.value }))} /><FormField label="Day" type="date" value={mf.date} onChange={e => setMf(s => ({ ...s, date: e.target.value }))} /><FormField label="Start hour (6 to 21)" type="number" min={6} max={21} value={mf.hour} onChange={e => setMf(s => ({ ...s, hour: e.target.value }))} /></div>}</Drawer>
    <ConfirmDialog open={!!cancel} danger title="Cancel this booking?" text={cancel ? `${cancel.date_label}, ${cancel.time_label}, ${cancel.court_label}. The player will be told.` : ''} confirmLabel="Yes, cancel booking" cancelLabel="No, keep it" loading={busy} onCancel={() => setCancel(null)} onConfirm={async () => { if (!reason.trim()) { toast.error('Please tell us why you are cancelling.'); return; } if (await run(() => api.post(`${base}/${cancel.id}/cancel`, { reason }), 'Booking cancelled.')) setCancel(null); }}><div className="mt-3"><FormField label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: court repairs" /></div></ConfirmDialog></>;
}
