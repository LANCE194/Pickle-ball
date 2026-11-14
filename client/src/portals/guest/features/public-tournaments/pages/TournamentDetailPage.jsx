import { Link, useParams } from 'react-router-dom';
import Card from '../../../../../shared/components/Card';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import EmptyState from '../../../../../shared/components/EmptyState';
import { useApi } from '../../../../../shared/hooks/useApi';
import Bracket from '../../../../../shared/components/Bracket';
/** Live standings page visible to guests. Every match shows Date, Time and Court name/number. */
export default function TournamentDetailPage() {
  const { id } = useParams(); const { data, loading, error, reload } = useApi(`/api/guest/public-tournaments/${id}`, null, { events: ['bracket.changed', 'score.updated'] });
  if (loading) return <div className="p-6 max-w-page mx-auto"><Skeleton lines={6} /></div>; if (error) return <div className="p-6 max-w-page mx-auto"><ErrorPanel error={error} onRetry={reload} /></div>;
  const t = data.tournament;
  return <div className="max-w-page mx-auto px-4 py-6 space-y-4"><Link to="/tournaments">Back to tournaments</Link><div className="flex items-start justify-between gap-2"><h1>{t.name}</h1><StatusBadge status={t.status} /></div><p>{t.starts_label} to {t.ends_label}</p>
    {t.status === 'completed' && data.standings[0] && <Card className="border-volt"><h2>Champion</h2><p className="text-xl font-semibold">{data.standings[0].name}</p></Card>}
    {data.standings.length > 0 && <Card><h2 className="mb-2">Standings</h2><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="py-1">Player or team</th><th>Played</th><th>Won</th><th>Lost</th></tr></thead><tbody>{data.standings.map(s => <tr key={s.entry_id} className="border-t line"><td className="py-2">{s.name}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.losses}</td></tr>)}</tbody></table></div></Card>}
    {data.matches.length ? <Bracket matches={data.matches} /> : <EmptyState title="The bracket is not ready yet" text="It is built after sign-up closes." />}</div>;
}
