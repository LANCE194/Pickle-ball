import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../../../../shared/hooks/useApi';
import Card from '../../../../../shared/components/Card';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import EmptyState from '../../../../../shared/components/EmptyState';
import Bracket from '../../../../../shared/components/Bracket';
export default function TournamentDetailPage() {
  const { id } = useParams(); const d = useApi(`/api/player/tournaments/${id}`, null, { events: ['bracket.changed'] }); const m = useApi(`/api/player/tournaments/${id}/matches`, null, { events: ['bracket.changed'] });
  if (d.loading) return <Skeleton lines={6} />; if (d.error) return <ErrorPanel error={d.error} onRetry={d.reload} />; const t = d.data.tournament;
  return <div className="space-y-4"><Link to="/app/tournaments">Back to tournaments</Link><div className="flex justify-between gap-2"><h1>{t.name}</h1><StatusBadge status={t.status} /></div><p>{t.starts_label} to {t.ends_label}</p>
    {t.rules && <Card><h2>Rules</h2><p className="whitespace-pre-line mt-1">{t.rules}</p></Card>}{t.prizes && <Card><h2>Prizes</h2><p className="mt-1">{t.prizes}</p></Card>}
    {d.data.standings.length > 0 && <Card><h2 className="mb-2">Standings</h2><ul className="space-y-1">{d.data.standings.map((s, i) => <li key={s.entry_id}>{i + 1}. {s.name} - {s.wins} won, {s.losses} lost</li>)}</ul></Card>}
    {m.data?.length ? <Bracket matches={m.data} /> : <EmptyState title="The bracket is not ready yet" text="It is built after sign-up closes." />}</div>;
}
