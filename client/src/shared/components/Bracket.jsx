import Card from './Card';
import StatusBadge from './StatusBadge';
// Matches grouped by round. Shows Date, Time and Court name/number for every match.
export default function Bracket({ matches }) {
  const groups = {}; for (const m of matches.filter(x => !x.is_bye)) { const k = `${m.bracket === 'RR' ? `Pool ${m.pool || ''} round ${m.round}` : `${{ W: 'Winners', L: 'Losers', F: 'Final' }[m.bracket]} round ${m.round}`}`; (groups[k] ||= []).push(m); }
  return <div className="space-y-4">{Object.entries(groups).map(([k, ms]) => <section key={k}><h2 className="mb-2">{k}</h2><div className="grid gap-3 md:grid-cols-2">{ms.map(m => <Card key={m.id}>
    <div className="flex justify-between gap-2"><div className="space-y-1"><p className={m.winner_entry && m.winner_entry === m.entry_a ? 'font-bold' : ''}>{m.side_a || 'To be decided'}</p><p className={m.winner_entry && m.winner_entry === m.entry_b ? 'font-bold' : ''}>{m.side_b || 'To be decided'}</p></div><StatusBadge status={m.status} /></div>
    {m.games?.length > 0 && <p className="mt-1 font-semibold">{m.games.map(g => `${g.a}-${g.b}`).join(', ')}</p>}
    <p className="muted text-sm mt-2">{m.date_label ? `${m.date_label}, ${m.time_label}, ${m.court_label}` : 'Time and court to be set'}</p></Card>)}</div></section>)}</div>;
}
