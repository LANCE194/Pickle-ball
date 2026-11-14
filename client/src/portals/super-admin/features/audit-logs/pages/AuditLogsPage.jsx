import { useState } from 'react';
import { useApi } from '../../../../../shared/hooks/useApi';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
const ROLES = ['super_admin', 'admin', 'staff', 'coach_referee', 'player'].map(r => ({ value: r, label: r.replace('_', ' ') }));
export default function AuditLogsPage() {
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const { data, loading, error, reload } = useApi('/api/super-admin/audit-logs', { q, role }, { events: ['notification.new'] });
  return <><PageHeader title="Audit Logs" subtitle="Who did what, and when." /><DataList items={data} loading={loading} error={error} onRetry={reload} search={{ placeholder: 'Search an action, for example login or payment' }} onSearch={setQ} filters={[{ name: 'role', label: 'Role', options: ROLES }]} values={{ role }} onFilter={(k, v) => setRole(v)} columns="grid-cols-1" empty={{ title: 'No log entries match', text: 'Try a different search.' }}
    renderItem={l => <Card className="flex flex-wrap gap-x-4 gap-y-1 items-baseline"><span className="font-mono font-semibold">{l.action}</span><span className="muted">{l.role || 'system'}</span><span>{l.entity}{l.entity_id ? ` ${String(l.entity_id).slice(0, 8)}` : ''}</span><span className="muted ml-auto">{l.date_label}, {l.time_label}</span>{l.details && <code className="w-full text-xs break-all muted">{JSON.stringify(l.details)}</code>}</Card>} /></>;
}
