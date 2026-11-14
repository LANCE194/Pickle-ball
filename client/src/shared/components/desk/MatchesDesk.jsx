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
import { todayManila } from '../../lib/format';
/** Score entry in under 30 seconds: tap a match, type up to 3 games, Save score. Games go to 11, win by 2. */
export default function MatchesDesk({ listPath, scorePath, title = 'Matches', canScore = true }) {
  const toast = useToast(); const [upcoming, setUpcoming] = useState(false); const { data, loading, error, reload } = useApi(listPath, { date: todayManila(), upcoming: String(upcoming) }, { events: ['bracket.changed', 'score.updated'] });
  const [m, setM] = useState(null); const [g, setG] = useState([{ a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }]); const [busy, setBusy] = useState(false);
  const open = match => { setM(match); const ex = (match.games || []).map(x => ({ a: String(x.a), b: String(x.b) })); setG([0, 1, 2].map(i => ex[i] || { a: '', b: '' })); };
  const save = async () => { const games = g.filter(x => x.a !== '' || x.b !== '').map(x => ({ a: Number(x.a), b: Number(x.b) })); setBusy(true); try { const r = await api.post(scorePath(m.id), { games }); toast.ok(r.message); setM(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return <><PageHeader title={title} />
    <div className="flex gap-2 mb-4"><Button variant={!upcoming ? 'primary' : 'secondary'} onClick={() => setUpcoming(false)}>Today</Button><Button variant={upcoming ? 'primary' : 'secondary'} onClick={() => setUpcoming(true)}>Next 7 days</Button></div>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No matches in this time', text: 'Matches appear here once a tournament bracket is built.' }}
      renderItem={x => <Card className="h-full space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold">{x.date_label}, {x.time_label}</p><StatusBadge status={x.status} /></div><p>{x.court_label}</p><p className="muted">{x.tournament}</p><div><p className="font-medium">{x.side_a}</p><p className="font-medium">{x.side_b}</p></div>{x.games?.length > 0 && <p className="font-semibold">{x.games.map(q => `${q.a}-${q.b}`).join(', ')}</p>}
        {canScore && <Button variant={x.status === 'completed' ? 'secondary' : 'primary'} disabled={!x.ready} onClick={() => open(x)}>{x.status === 'completed' ? 'Change score' : x.ready ? 'Enter score' : 'Waiting for players'}</Button>}</Card>} />
    <Drawer open={!!m} onClose={() => setM(null)} title="Enter score" footer={<><Button variant="secondary" onClick={() => setM(null)}>Cancel</Button><Button loading={busy} onClick={save}>Save score</Button></>}>
      {m && <div className="space-y-4"><p className="font-medium">{m.side_a} <span className="muted">vs</span> {m.side_b}</p><p className="text-sm muted">Games go to 11 and are won by 2. Best of 3.</p>
        {g.map((x, i) => <div key={i} className="grid grid-cols-2 gap-3"><FormField label={`Game ${i + 1}: ${m.side_a.split(' / ')[0]}`} type="number" min={0} value={x.a} onChange={e => setG(s => s.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)))} /><FormField label={`Game ${i + 1}: ${m.side_b.split(' / ')[0]}`} type="number" min={0} value={x.b} onChange={e => setG(s => s.map((y, j) => (j === i ? { ...y, b: e.target.value } : y)))} /></div>)}</div>}</Drawer></>;
}
