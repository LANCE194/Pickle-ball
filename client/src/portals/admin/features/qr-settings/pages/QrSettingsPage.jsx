import { api } from '../../../../../shared/lib/api';
import CrudPage from '../../../../../shared/components/CrudPage';
import AuthImage from '../../../../../shared/components/AuthImage';
import StatusBadge from '../../../../../shared/components/StatusBadge';
const B = '/api/admin/qr-settings';
const toForm = f => { const fd = new FormData(); for (const k of ['provider', 'account_name', 'account_number']) fd.append(k, f[k] ?? ''); fd.append('enabled', String(f.enabled !== false)); if (f.file instanceof File) fd.append('file', f.file); return fd; };
// Only the owner changes QR codes. Staff can verify payments but have no route here.
export default function QrSettingsPage() {
  return <CrudPage title="QR Settings" subtitle="The QR codes players scan to pay." listPath={B} createLabel="Add a QR code" initial={{ provider: 'gcash', enabled: true }}
    fields={[{ name: 'provider', label: 'Payment type', options: [{ value: 'gcash', label: 'GCash' }, { value: 'maya', label: 'Maya' }, { value: 'bank', label: 'Bank' }] }, { name: 'account_name', label: 'Name on the account', required: true }, { name: 'account_number', label: 'Account or mobile number', required: true }, { name: 'file', type: 'file', label: 'QR picture', helper: 'JPG or PNG, up to 5 MB. When editing, leave empty to keep the current picture.' }, { name: 'enabled', label: 'Show this QR to players', type: 'checkbox' }]}
    onCreate={f => api.upload(B, toForm(f)).then(() => ({ message: 'QR code saved.' }))} onUpdate={(q, f) => api.upload(`${B}/${q.id}`, toForm(f), 'PATCH').then(() => ({ message: 'Changes saved.' }))}
    archive={{ label: 'Remove from list', title: 'Remove this QR code?', text: 'Players will no longer see it.', run: q => api.del(`${B}/${q.id}`).then(() => ({ message: 'QR code removed from the list.' })) }}
    extraActions={(q, reload) => [{ label: q.enabled ? 'Hide from players' : 'Show to players', onClick: async () => { await api.post(`${B}/${q.id}/toggle`, { enabled: !q.enabled }); reload(); } }]}
    empty={{ title: 'No QR codes yet', text: 'Add your GCash, Maya or bank QR so players can pay.' }}
    card={q => <div className="space-y-2"><div className="flex justify-between gap-2"><p className="font-semibold uppercase">{q.provider}</p><StatusBadge status={q.enabled ? 'active' : 'inactive'} label={q.enabled ? 'Shown to players' : 'Hidden'} /></div><AuthImage path={`/api/files/${q.image_path}`} alt={`${q.provider} QR code`} className="w-40 rounded-card" /><p>{q.account_name}</p><p className="muted">{q.account_number}</p></div>} />;
}
