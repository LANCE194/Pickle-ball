import MatchesDesk from '../../../../../shared/components/desk/MatchesDesk';
export default function TodaysMatchesPage() { return <MatchesDesk title="Today's Matches" listPath="/api/coach-referee/todays-matches" scorePath={id => `/api/coach-referee/score-entry/${id}`} />; }
