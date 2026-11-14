import { useState } from 'react';
import { Pencil } from '../../../../../shared/lib/icons';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Drawer from '../../../../../shared/components/Drawer';
import Button from '../../../../../shared/components/Button';
import FormField from '../../../../../shared/components/FormField';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import FileUpload from '../../../../../shared/components/FileUpload';
import AuthImage from '../../../../../shared/components/AuthImage';
import { useSession } from '../../../../../shared/hooks/useSession';
const EDIT = [
  ['first_name', 'First name', 'text', true],
  ['middle_name', 'Middle name'],
  ['last_name', 'Last name', 'text', true],
  ['nickname', 'Nickname'],
  ['birthdate', 'Birthdate', 'date'],
  ['gender', 'Gender'],
  ['street', 'Street'],
  ['barangay', 'Barangay'],
  ['city', 'City'],
  ['province', 'Province'],
  ['emergency_name', 'Emergency contact name'],
  ['emergency_relationship', 'Relationship'],
  ['emergency_number', 'Emergency contact number'],
  ['specialization', 'Specialization'],
];
export default function ProfilePage() {
  const { refresh } = useSession(); const toast = useToast(); const { data: p, loading, error, reload } = useApi('/api/coach-referee/profile'); const [open, setOpen] = useState(false); const [f, setF] = useState({}); const [err, setErr] = useState({}); const [photo, setPhoto] = useState(null); const [busy, setBusy] = useState(false); const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  if (loading) return <Skeleton lines={5} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  const edit = () => { setF({ ...p, birthdate: p.birthdate ? String(p.birthdate).slice(0, 10) : '' }); setErr({}); setPhoto(null); setOpen(true); };
  const save = async () => { setBusy(true); setErr({}); try { const body = Object.fromEntries(EDIT.map(([name]) => [name, f[name] ?? ''])); await api.patch('/api/coach-referee/profile', body); if (photo) { const fd = new FormData(); fd.append('file', photo); await api.upload('/api/coach-referee/profile/photo', fd); } toast.ok('Changes saved.'); setOpen(false); setPhoto(null); await Promise.all([reload(), refresh()]); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  const row = (k, v) => <div className="flex justify-between gap-3 py-2 border-t line first:border-0"><span className="muted">{k}</span><span className="text-right">{v || '-'}</span></div>;
  return <div className="max-w-2xl space-y-4"><PageHeader title="Profile" action={{ label: 'Edit my profile', icon: Pencil, onClick: edit }} />
    <Card className="flex items-center gap-4">{p.photo_path ? <AuthImage path={`/api/files/${p.photo_path}`} alt="Your profile photo" className="h-20 w-20 rounded-full object-cover" /> : <div className="h-20 w-20 rounded-full bg-court/15 flex items-center justify-center text-2xl font-heading text-court">{p.first_name?.[0] || '?'}</div>}<div><h2>{p.first_name} {p.last_name}</h2><p className="muted capitalize">{p.role_type}</p></div></Card>
    <Card>{row('Mobile', p.mobile)}{row('Email', p.email)}{row('Age', p.age)}{row('Nickname', p.nickname)}{row('Gender', p.gender)}{row('Street', p.street)}{row('Barangay', p.barangay)}{row('City', p.city)}{row('Province', p.province)}{row('Emergency contact', p.emergency_name)}{row('Emergency relationship', p.emergency_relationship)}{row('Emergency number', p.emergency_number)}{row('Specialization', p.specialization)}{row('Certification', p.certification_name)}{row('Certification number', p.certification_no)}{row('Certifying body', p.certifying_body)}{row('Certificate ends', p.certification_expiry && String(p.certification_expiry).slice(0, 10))}{row('Years of experience', p.years_experience)}{row('Matches officiated', p.matches_officiated)}{row('Level range', p.level_min != null ? `${p.level_min} to ${p.level_max}` : null)}</Card>
    <Drawer open={open} onClose={() => setOpen(false)} title="Edit my profile" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Save changes</Button></>}><div className="space-y-4"><FileUpload label="Profile photo" onChange={setPhoto} />{EDIT.map(([n, l, t, required]) => <FormField key={n} name={n} label={l} type={t} required={required} value={f[n] ?? ''} onChange={set} error={err[n]} />)}<p className="text-sm muted">Certification, role, and experience details are changed by the club owner.</p></div></Drawer></div>;
}
