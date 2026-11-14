import MatchesDesk from '../../../../../shared/components/desk/MatchesDesk';
// Same quick score form as Today's Matches, for matches in the next 7 days too.
export default function ScoreEntryPage() { return <MatchesDesk title="Score Entry" listPath="/api/coach-referee/todays-matches" scorePath={id => `/api/coach-referee/score-entry/${id}`} />; }
