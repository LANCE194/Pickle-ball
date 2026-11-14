import { useState } from 'react';
import { Pencil } from '../../../../../shared/lib/icons';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useSession } from '../../../../../shared/hooks/useSession';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Drawer from '../../../../../shared/components/Drawer';
import Button from '../../../../../shared/components/Button';
import FormField from '../../../../../shared/components/FormField';
import FileUpload from '../../../../../shared/components/FileUpload';
import AuthImage from '../../../../../shared/components/AuthImage';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';

const FIELDS = [
  ['first_name', 'First name', undefined, true],
  ['middle_name', 'Middle name'],
  ['last_name', 'Last name', undefined, true],
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
];

export default function AccountProfilePage() {
  const { user, refresh } = useSession();
  const endpoint = user?.role === 'staff' ? '/api/staff/account-profile' : '/api/admin/account-profile';
  const toast = useToast();
  const { data: p, loading, error, reload } = useApi(endpoint);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = e => setForm(state => ({ ...state, [e.target.name]: e.target.value }));
  const edit = () => {
    setForm({ ...p, birthdate: p.birthdate ? String(p.birthdate).slice(0, 10) : '' });
    setFieldErrors({});
    setPhoto(null);
    setOpen(true);
  };
  const save = async () => {
    setBusy(true);
    setFieldErrors({});
    try {
      const body = Object.fromEntries(FIELDS.map(([name]) => [name, form[name] ?? '']));
      await api.patch(endpoint, body);
      if (photo) {
        const data = new FormData();
        data.append('file', photo);
        await api.upload(`${endpoint}/photo`, data);
      }
      toast.ok('Changes saved.');
      setOpen(false);
      setPhoto(null);
      await Promise.all([reload(), refresh()]);
    } catch (e) {
      setFieldErrors(e.fields || {});
      if (!e.fields) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Skeleton lines={5} />;
  if (error) return <ErrorPanel error={error} onRetry={reload} />;

  const row = (label, value) => <div key={label} className="flex justify-between gap-3 py-2 border-t line first:border-0"><span className="muted">{label}</span><span className="text-right">{value || '-'}</span></div>;
  return <div className="max-w-2xl space-y-4">
    <PageHeader title="My Profile" action={{ label: 'Edit my profile', icon: Pencil, onClick: edit }} />
    <Card className="flex items-center gap-4">
      {p.photo_path
        ? <AuthImage path={`/api/files/${p.photo_path}`} alt="Your profile photo" className="h-20 w-20 rounded-full object-cover" />
        : <div className="h-20 w-20 rounded-full bg-court/15 flex items-center justify-center text-2xl font-heading text-court">{p.first_name?.[0] || '?'}</div>}
      <div><h2>{p.first_name} {p.last_name}</h2><p className="muted capitalize">{p.role === 'staff' ? p.position_title || 'Staff' : p.position_title || 'Club Admin'}</p></div>
    </Card>
    <Card>
      <h2>Personal details</h2>
      {row('Middle name', p.middle_name)}
      {row('Nickname', p.nickname)}
      {row('Birthdate', p.birthdate && String(p.birthdate).slice(0, 10))}
      {row('Gender', p.gender)}
      {row('Street', p.street)}
      {row('Barangay', p.barangay)}
      {row('City', p.city)}
      {row('Province', p.province)}
      {row('Emergency contact', p.emergency_name)}
      {row('Relationship', p.emergency_relationship)}
      {row('Emergency number', p.emergency_number)}
      {row('Email', p.email)}
      {row('Mobile', p.mobile)}
      {p.employee_id && row('Employee ID', p.employee_id)}
    </Card>
    <Drawer open={open} onClose={() => setOpen(false)} title="Edit my profile" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Save changes</Button></>}>
      <div className="space-y-4">
        <p className="text-sm muted">Update your personal details and photo. Login contact details, job details, and permissions are managed by your club owner.</p>
        <FileUpload label="Profile photo" onChange={setPhoto} />
        {FIELDS.map(([name, label, type, required]) => <FormField key={name} name={name} label={label} type={type} required={required} value={form[name] ?? ''} onChange={set} error={fieldErrors[name]} />)}
      </div>
    </Drawer>
  </div>;
}
