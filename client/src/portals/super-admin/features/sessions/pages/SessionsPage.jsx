import { api } from '../../../../../shared/lib/api';
import { useToast } from '../../../../../shared/components/Toast';
import CrudPage from '../../../../../shared/components/CrudPage';
export default function SessionsPage() {
  const toast = useToast();
  return <CrudPage title="Sessions" subtitle="Everyone signed in right now. Each browser tab is its own session." listPath="/api/super-admin/sessions" empty={{ title: 'Nobody is signed in', text: 'Active sessions show here.' }}
    card={s => <div className="space-y-1"><p className="font-semibold">{s.email || s.mobile}</p><p className="muted capitalize">{s.role.replace('_', ' ')}</p><p className="text-sm break-all">{s.device_info}</p><p className="text-sm muted">Started {new Date(s.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}. Last seen {new Date(s.last_seen_at).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' })}</p></div>}
    archive={{ label: 'Sign out this session', title: 'Sign this session out?', text: 'That browser tab is signed out right away.', run: s => api.post(`/api/super-admin/sessions/${s.id}/revoke`).then(() => ({ message: 'Session signed out.' })) }} />;
}
