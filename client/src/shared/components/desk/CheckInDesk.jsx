import { useState } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import PageHeader from '../PageHeader';
import Card from '../Card';
import Button from '../Button';
import FormField from '../FormField';
import EmptyState from '../EmptyState';
import Skeleton from '../Skeleton';
/** Member check-in: type a name and tap (2 taps), or paste/scan a player QR code. Attendance log below. */
export default function CheckInDesk({ base }) {
  const toast = useToast(); const [q, setQ] = useState(''); const [qr, setQr] = useState(''); const found = useApi(`${base}/search`, { q }, { enabled: q.length > 1 }); const today = useApi(base, null, { events: ['attendance.changed'] });
  const go = async (id, method = 'name') => { try { const r = await api.post(base, { player_id: id, method }); toast.ok(r.message); setQ(''); setQr(''); today.reload(); } catch (e) { toast.error(e.message); } };
  return <><PageHeader title="Check-in" subtitle="Check players in when they arrive." />
    <div className="grid gap-4 md:grid-cols-2"><Card className="space-y-3"><FormField label="Find a player by name" value={q} onChange={e => setQ(e.target.value)} placeholder="Type at least 2 letters" />{(found.data || []).map(p => <Button key={p.id} full variant="secondary" onClick={() => go(p.id)}>Check in {p.name}</Button>)}{q.length > 1 && found.data && !found.data.length && <p className="muted">No player found. Check the spelling or add them under Members.</p>}
      <FormField label="Or scan a player QR code" value={qr} onChange={e => setQr(e.target.value)} helper="A scanner types the code here. Then tap the button." /><Button variant="primary" disabled={!qr} onClick={() => go(qr.trim(), 'qr')}>Check in with QR code</Button></Card>
      <Card><h2>Today ({today.data?.count ?? 0})</h2>{today.loading ? <Skeleton /> : !today.data?.rows.length ? <EmptyState title="Nobody checked in yet" text="Check-ins will show here." /> : <ul className="mt-2 space-y-2">{today.data.rows.map(r => <li key={r.id} className="flex justify-between gap-2"><span>{r.first_name} {r.last_name}</span><span className="muted">{r.time_label}</span></li>)}</ul>}</Card></div></>;
}
