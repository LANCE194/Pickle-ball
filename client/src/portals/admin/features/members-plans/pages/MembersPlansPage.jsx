import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import { useFeature } from '../../../../../shared/hooks/useFeature';
import CrudPage from '../../../../../shared/components/CrudPage';
import PlayersDesk from '../../../../../shared/components/desk/PlayersDesk';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Button from '../../../../../shared/components/Button';
import Drawer from '../../../../../shared/components/Drawer';
import FormField from '../../../../../shared/components/FormField';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
const B = '/api/admin/members-plans';
export default function MembersPlansPage() {
  const toast = useToast(); const [tab, setTab] = useState('members'); const plans = useApi(`${B}/plans`); const attendance = useFeature('checkin_attendance'); const [ren, setRen] = useState(null);
  const planOpts = (plans.data || []).filter(p => p.active).map(p => ({ value: p.id, label: `${p.name} (${p.price_label})` }));
  const tabs = [['members', 'Members'], ['plans', 'Plans'], ['players', 'All players']];
  return <><div className="flex flex-wrap gap-2 mb-4">{tabs.map(([k, l]) => <Button key={k} variant={tab === k ? 'primary' : 'secondary'} onClick={() => setTab(k)}>{l}</Button>)}{attendance && <Button variant="ghost" onClick={() => api.download('/api/admin/reports/attendance.xlsx', 'attendance.xlsx').catch(e => toast.error(e.message))}>Download attendance (Excel)</Button>}</div>
    {tab === 'members' && <><CrudPage title="Members" listPath={`${B}/members`} search="Search members" filters={[{ name: 'plan', label: 'Plan', options: planOpts }, { name: 'status', label: 'Status', options: ['active', 'expiring', 'expired'].map(s => ({ value: s, label: s })) }, { name: 'level', label: 'Level', options: ['beginner', 'intermediate', 'advanced', 'pro'].map(s => ({ value: s, label: s })) }, { name: 'expiring', label: 'Ending', options: [{ value: '7', label: 'In 7 days' }, { value: '30', label: 'In 30 days' }] }]}
      createLabel="Add a member" initial={{ paid_now: false }} fields={[{ name: 'first_name', label: 'First name', required: true }, { name: 'last_name', label: 'Last name', required: true }, { name: 'mobile', label: 'Mobile number', type: 'tel', helper: 'Add a mobile number or an email.' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'password', label: 'Password', type: 'password', required: true, autoComplete: 'new-password', helper: 'Use at least 8 characters with a letter and a number.' }, { name: 'plan_id', label: 'Plan', options: planOpts, placeholder: 'Choose a plan' }, { name: 'paid_now', label: 'They paid at the desk', type: 'checkbox', helper: 'Leave unticked to approve the payment later under Payments.' }]}
      onCreate={f => api.post(`${B}/members`, f)} empty={{ title: 'No members yet', text: 'Add a member with a contact and permanent password, then choose a plan.' }}
      card={m => <div className="space-y-1"><div className="flex justify-between gap-2"><p className="font-semibold">{m.first_name} {m.last_name}</p><StatusBadge status={m.status} /></div><p>{m.plan_name} - {Number(m.discount_percent)}% off</p><p className="muted">Ends {String(m.expires_on).slice(0, 10)}</p><p className="muted capitalize">Level {Number(m.rating).toFixed(1)} {m.skill_level}</p></div>}
      extraActions={m => [{ label: 'Renew', variant: 'secondary', onClick: () => setRen({ m, plan_id: m.plan_id, paid_now: false }) }]} />
      <Drawer open={!!ren} onClose={() => setRen(null)} title="Renew membership" footer={<><Button variant="secondary" onClick={() => setRen(null)}>Cancel</Button><Button onClick={async () => { try { const r = await api.post(`${B}/members/${ren.m.player_id}/renew`, { plan_id: ren.plan_id, paid_now: ren.paid_now }); toast.ok(r.message); setRen(null); } catch (e) { toast.error(e.message); } }}>Renew membership</Button></>}>{ren && <div className="space-y-4"><p>{ren.m.first_name} {ren.m.last_name}</p><FormField label="Plan" options={planOpts} value={ren.plan_id} onChange={e => setRen(s => ({ ...s, plan_id: e.target.value }))} /><FormField type="checkbox" label="They paid at the desk" value={ren.paid_now} onChange={e => setRen(s => ({ ...s, paid_now: e.target.value }))} /></div>}</Drawer></>}
    {tab === 'plans' && <CrudPage title="Membership plans" listPath={`${B}/plans`} createLabel="Add a plan" initial={{ duration_days: 30, discount_percent: 10, active: true }} fields={[{ name: 'name', label: 'Plan name', required: true, placeholder: 'Monthly Member' }, { name: 'price', label: 'Price (PHP)', type: 'number' }, { name: 'duration_days', label: 'Lasts how many days?', type: 'number' }, { name: 'discount_percent', label: 'Discount on court time (%)', type: 'number' }, { name: 'priority_booking', label: 'Priority booking', type: 'checkbox' }, { name: 'perks', label: 'Other perks', textarea: true }]}
      onCreate={f => api.post(`${B}/plans`, f).then(() => ({ message: 'Plan added.' }))} onUpdate={(p, f) => api.patch(`${B}/plans/${p.id}`, f).then(() => ({ message: 'Changes saved.' }))} empty={{ title: 'No plans yet', text: 'Create a plan with a price, length and discount.' }}
      card={p => <div className="space-y-1"><p className="font-semibold">{p.name}</p><p className="text-xl font-bold">{p.price_label}</p><p className="muted">{p.duration_days} days, {Number(p.discount_percent)}% off{p.priority_booking ? ', priority booking' : ''}</p>{p.perks && <p>{p.perks}</p>}</div>} />}
    {tab === 'players' && <PlayersDesk base={`${B}/players`} title="All players" canRestore canOverride />}
  </>;
}
