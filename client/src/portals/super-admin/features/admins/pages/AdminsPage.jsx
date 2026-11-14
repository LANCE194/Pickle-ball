import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useToast } from '../../../../../shared/components/Toast';
import CrudPage from '../../../../../shared/components/CrudPage';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
const B = '/api/super-admin/admins';
const fields = [{ name: 'first_name', label: 'First name', required: true }, { name: 'last_name', label: 'Last name', required: true }, { name: 'email', label: 'Email (used to log in)', type: 'email', required: true }, { name: 'password', label: 'Password', type: 'password', required: true, autoComplete: 'new-password', helper: 'Use at least 8 characters with a letter and a number.', showWhen: form => !form.id }, { name: 'mobile', label: 'Mobile number', type: 'tel' }, { name: 'club_name', label: 'Club or business name' }, { name: 'position_title', label: 'Position', placeholder: 'Owner' }];
export default function AdminsPage() {
  const toast = useToast(); const [temp, setTemp] = useState(null); const [sus, setSus] = useState(null);
  return <><CrudPage title="Admins" subtitle="Club owner accounts. Only you can create them." listPath={B} createLabel="Add an admin" fields={fields} onCreate={f => api.post(B, f)}
    empty={{ title: 'No admin accounts yet', text: 'Add the club owner and set their permanent password.' }}
    card={a => <div className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{a.first_name} {a.last_name}</p><StatusBadge status={a.status} /></div><p>{a.email}</p><p className="muted">{a.club_name}</p></div>}
    extraActions={(a, reload) => [{ label: 'Reset password', onClick: async () => { try { const r = await api.post(`${B}/${a.id}/reset-password`); setTemp(r.temporaryPassword); } catch (e) { toast.error(e.message); } } }, a.status === 'suspended' ? { label: 'Allow login again', onClick: async () => { await api.post(`${B}/${a.id}/status`, { status: 'active' }); reload(); } } : { label: 'Suspend login', onClick: () => setSus({ a, reload }) }]} />
    <ConfirmDialog open={!!temp} title="Password reset" text="Share this temporary reset password once. The admin must choose a new password at next login." confirmLabel="I have copied it" cancelLabel="Close" onCancel={() => setTemp(null)} onConfirm={() => setTemp(null)}><p className="mt-3 font-mono text-lg rounded-card border line p-3 select-all break-all">{temp}</p></ConfirmDialog>
    <ConfirmDialog open={!!sus} danger title="Suspend this admin?" text="They are signed out everywhere right away. Their data is kept." confirmLabel="Suspend login" cancelLabel="No, keep active" onCancel={() => setSus(null)} onConfirm={async () => { try { await api.post(`${B}/${sus.a.id}/status`, { status: 'suspended' }); sus.reload(); toast.ok('Admin suspended.'); } catch (e) { toast.error(e.message); } setSus(null); }} /></>;
}
