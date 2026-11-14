import PlayersDesk from '../../../../../shared/components/desk/PlayersDesk';
// Staff add and edit players. They can archive but never delete, and cannot bring archived players back (admin only).
export default function PlayersMembersPage() { return <PlayersDesk base="/api/staff/players-members" title="Members" />; }
