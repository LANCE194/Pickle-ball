import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import Stepper from '../../../../../shared/components/Stepper';
import SlotGrid from '../../../../../shared/components/SlotGrid';
import FormField from '../../../../../shared/components/FormField';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import { todayManila, addDays, dayLabel } from '../../../../../shared/lib/format';
/** 3 steps: (1) date, (2) court + time + length, (3) review and book. Home -> review takes 4 taps. */
export default function BookCourtPage() {
  const nav = useNavigate(); const toast = useToast(); const again = useLocation().state?.again;
  const [step, setStep] = useState(0); const [date, setDate] = useState(todayManila()); const [pick, setPick] = useState(null); const [hours, setHours] = useState(again?.duration_hours || 1); const [count, setCount] = useState(again?.players_count || 2); const [busy, setBusy] = useState(false); const [alts, setAlts] = useState(null);
  const grid = useApi('/api/player/book-court/slots', { date }, { enabled: step === 1, events: ['availability.changed'] });
  const courts = useMemo(() => (grid.data?.courts || []).filter(c => !again?.court_id || true), [grid.data, again]);
  const quote = useApi('/api/player/book-court/quote', pick ? { court: pick.court.id, start: pick.slot.start, hours } : null, { enabled: step === 2 && !!pick });
  // longest run of free hours from the chosen start (so the length buttons only offer what fits)
  const maxHours = useMemo(() => { if (!pick) return 3; const c = courts.find(x => x.court.id === pick.court.id); if (!c) return 1; const i = c.slots.findIndex(s => s.start === pick.slot.start); let n = 0; while (n < 3 && c.slots[i + n] && c.slots[i + n].status === 'available') n++; return Math.max(n, 1); }, [pick, courts]);
  const choose = (court, slot) => { setPick({ court, slot }); setHours(h => Math.min(h, 3)); };
  const book = async () => {
    setBusy(true); setAlts(null);
    try { const r = await api.post('/api/player/book-court', { court_id: pick.court.id, start: pick.slot.start, hours, players_count: count }); toast.ok(r.message); nav(`/app/payments/${r.payment.id}`, { replace: true });
    } catch (e) { if (e.alternatives) { setAlts(e.alternatives); setStep(1); grid.reload(); } toast.error(e.code === 'SLOT_TAKEN' ? 'That time was just taken. Here are other free times on the same day.' : e.message); } finally { setBusy(false); }
  };
  const d = quote.data;
  return <div className="max-w-3xl pb-24"><h1 className="mb-2">Book a court</h1><Stepper steps={['Date', 'Court and time', 'Review']} current={step} />
    {step === 0 && <Card className="space-y-4"><h2>Which day?</h2><div className="flex items-center gap-2"><Button variant="secondary" disabled={date <= todayManila()} onClick={() => setDate(addDays(date, -1))}>Back</Button><strong className="flex-1 text-center text-lg">{dayLabel(date)}</strong><Button variant="secondary" onClick={() => setDate(addDays(date, 1))}>Next day</Button></div>
      <FormField label="Or pick a date" type="date" min={todayManila()} value={date} onChange={e => e.target.value && setDate(e.target.value)} /><Button variant="book" full onClick={() => setStep(1)}>Continue</Button></Card>}
    {step === 1 && <div className="space-y-4"><div className="flex items-center justify-between"><h2>{dayLabel(date)}</h2><Button variant="ghost" onClick={() => setStep(0)}>Change day</Button></div>
      {alts && <Card className="border-clay"><p className="font-medium">That time was just taken. Here are other free times on the same day.</p><div className="flex flex-wrap gap-2 mt-2">{alts.map(a => <Button key={a.court_id + a.start} variant="secondary" onClick={() => { const c = grid.data.courts.find(x => x.court.id === a.court_id); const s = c?.slots.find(x => x.start === a.start); if (s) choose(c.court, s); setAlts(null); }}>{a.court}: {a.label}</Button>)}</div></Card>}
      {grid.loading ? <Skeleton lines={5} /> : grid.error ? <ErrorPanel error={grid.error} onRetry={grid.reload} /> : <SlotGrid courts={courts} selected={pick ? [{ court: pick.court.id, start: pick.slot.start }] : []} onToggle={choose} />}
      {pick && <Card className="space-y-3"><p className="font-semibold">{pick.court.name} (Court {pick.court.court_number}), {pick.slot.label.split(' - ')[0]}</p>
        <div><p className="font-medium mb-1">How long?</p><div className="flex gap-2">{[1, 2, 3].map(h => <Button key={h} variant={hours === h ? 'primary' : 'secondary'} disabled={h > maxHours} onClick={() => setHours(h)}>{h} hour{h > 1 ? 's' : ''}</Button>)}</div></div>
        <FormField label="How many players?" type="number" min={1} max={8} value={count} onChange={e => setCount(Number(e.target.value))} /></Card>}
      <Button variant="book" full disabled={!pick} onClick={() => setStep(2)}>Continue</Button></div>}
    {step === 2 && pick && <Card className="space-y-3"><h2>Check your booking</h2>{quote.loading ? <Skeleton /> : quote.error ? <ErrorPanel error={quote.error} onRetry={quote.reload} /> : <>
      <p className="text-lg font-semibold">{d.schedule_line}</p><p>{count} players, {hours} hour{hours > 1 ? 's' : ''}</p>
      <p className="text-2xl font-bold">{d.total_label}</p>{d.discountPercent > 0 && <p className="text-court dark:text-volt">Member discount of {d.discountPercent}% included.</p>}
      <p className="muted">{d.cancellation_rule}</p><p className="muted">{d.hold_rule}</p>
      <Button variant="book" full loading={busy} onClick={book}>Book this court</Button><Button variant="ghost" full onClick={() => setStep(1)}>Change time</Button></>}</Card>}
  </div>;
}
