import { api } from '../../../../../shared/lib/api';
import { useToast } from '../../../../../shared/components/Toast';
import CrudPage from '../../../../../shared/components/CrudPage';
import StatusBadge from '../../../../../shared/components/StatusBadge';
// View only. Coaches can confirm a level; personal details stay hidden.
export default function AssignedPlayersPage() {
  const toast = useToast();
  return <CrudPage title="Players" subtitle="Players in your level range." listPath="/api/coach-referee/assigned-players" search="Search players" empty={{ title: 'No players in your range', text: 'Players show here when their level is inside your assigned range.' }}
    card={p => <div className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{p.name}</p><StatusBadge status={p.status === 'pending_verification' ? 'pending_verification_player' : p.status} label={p.status === 'pending_verification' ? 'Pending check' : undefined} /></div><p>Level {Number(p.rating).toFixed(1)} <span className="capitalize">{p.skill_level}</span></p><p className="muted">{p.level_verified ? 'Level confirmed' : 'Level not confirmed yet'}</p></div>}
    extraActions={(p, reload) => !p.level_verified ? [{ label: 'Confirm level', variant: 'secondary', onClick: async () => { try { const r = await api.post(`/api/coach-referee/assigned-players/${p.id}/verify-level`, {}); toast.ok(r.message); reload(); } catch (e) { toast.error(e.message); } } }] : []} />;
}
