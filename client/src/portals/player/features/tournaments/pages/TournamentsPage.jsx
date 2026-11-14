import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
export default function TournamentsPage() {
  const nav = useNavigate(); const toast = useToast(); const { data, loading, error, reload } = useApi('/api/player/tournaments', null, { events: ['tournament.changed', 'bracket.changed'] });
  const [join, setJoin] = useState(null); const [q, setQ] = useState(''); const [partner, setPartner] = useState(''); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [out, setOut] = useState(null);
  const partners = useApi('/api/player/tournaments/partners', { q }, { enabled: !!join && join.category !== 'singles' && q.length > 1 });
  const register = async () => { setBusy(true); setErr({}); try { const r = await api.post(`/api/player/tournaments/${join.id}/register`, { partner_id: partner || null }); toast.ok(r.message); setJoin(null); if (r.payment) nav(`/app/payments/${r.payment.id}`); else reload(); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  const withdraw = async () => { try { await api.post(`/api/player/tournaments/entries/${out.my_entry.id}/withdraw`); toast.ok('You left the tournament.'); reload(); } catch (e) { toast.error(e.message); } setOut(null); };
  return <><PageHeader title="Tournaments" />
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No tournaments right now', text: 'When the club opens a tournament, you can join it here.' }}
      renderItem={t => <Card className="h-full space-y-2"><div className="flex justify-between gap-2"><h3>{t.name}</h3><StatusBadge status={t.status} /></div><p>{t.starts_label} to {t.ends_label}</p><p className="muted capitalize">{t.category}, {t.format.replace(/_/g, ' ')}, level {t.level_min} to {t.level_max}</p><p>Entry fee {t.fee_label}. {t.approved_count} of {t.max_slots} slots filled.</p>
        {t.my_entry && <StatusBadge status={t.my_entry.status} />}
        <div className="flex flex-wrap gap-2"><Link to={`/app/tournaments/${t.id}`} className="min-h-tap inline-flex items-center underline">Bracket and results</Link>
          {t.status === 'registration_open' && !t.my_entry && <Button variant="book" onClick={() => { setJoin(t); setPartner(''); setQ(''); setErr({}); }}>Join this tournament</Button>}
          {t.my_entry && ['pending', 'approved', 'waitlisted'].includes(t.my_entry.status) && ['registration_open', 'registration_closed'].includes(t.status) && <Button variant="ghost" onClick={() => setOut(t)}>Leave tournament</Button>}</div></Card>} />
    <Drawer open={!!join} onClose={() => setJoin(null)} title={join ? `Join ${join.name}` : ''} footer={<><Button variant="secondary" onClick={() => setJoin(null)}>Cancel</Button><Button variant="book" loading={busy} onClick={register}>Join and continue</Button></>}>
      {join && <div className="space-y-4"><p>Entry fee: <strong>{join.fee_label}</strong>. You pay with the same QR steps as a booking.</p>{join.rules && <div><h3>Rules</h3><p className="whitespace-pre-line">{join.rules}</p></div>}
        {join.category !== 'singles' && <><FormField label="Search for your partner" value={q} onChange={e => setQ(e.target.value)} helper="Your partner must already be added to the club." placeholder="Type a name" error={err.partner_id} />
          {(partners.data || []).map(p => <Button key={p.id} variant={partner === p.id ? 'primary' : 'secondary'} full onClick={() => setPartner(p.id)}>{p.name} ({Number(p.rating).toFixed(1)})</Button>)}</>}</div>}</Drawer>
    <ConfirmDialog open={!!out} danger title="Leave this tournament?" text="Your spot will go to the next person on the waitlist." confirmLabel="Yes, leave" cancelLabel="No, stay" onCancel={() => setOut(null)} onConfirm={withdraw} /></>;
}
