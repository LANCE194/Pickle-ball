import MatchesDesk from '../../../../../shared/components/desk/MatchesDesk';
export default function MatchesScoresPage() { return <MatchesDesk title="Matches" listPath="/api/staff/matches-scores" scorePath={id => `/api/staff/matches-scores/${id}/scores`} />; }
