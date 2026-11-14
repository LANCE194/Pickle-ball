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
import FileUpload from '../../../../../shared/components/FileUpload';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import AuthImage from '../../../../../shared/components/AuthImage';
const FIELDS = [['nickname', 'Nickname'], ['gender', 'Gender'], ['birthdate', 'Birthdate', 'date'], ['street', 'Street'], ['barangay', 'Barangay'], ['city', 'City'], ['province', 'Province'], ['emergency_name', 'Emergency contact name'], ['emergency_relationship', 'Relationship'], ['emergency_number', 'Emergency contact number', 'tel'], ['height_cm', 'Height (cm)', 'number'], ['occupation', 'Occupation (optional)'], ['heard_about', 'How did you hear about the club?'], ['shirt_size', 'Shirt size (for tournaments)', 'text', ['XS', 'S', 'M', 'L', 'XL', '2XL']], ['medical_notes', 'Private medical notes or allergies (optional)', 'textarea']];
export default function MyProfileLevelPage() {
  const toast = useToast(); const { data, loading, error, reload } = useApi('/api/player/my-profile-level'); const hist = useApi('/api/player/my-profile-level/history');
  const [open, setOpen] = useState(false); const [f, setF] = useState({}); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [photo, setPhoto] = useState(null);
  if (loading) return <Skeleton lines={6} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  const p = data.profile; const minor = p.age !== null && p.age < 18;
  const edit = () => { setF({ ...p, birthdate: p.birthdate ? String(p.birthdate).slice(0, 10) : '' }); setErr({}); setOpen(true); };
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const save = async () => { setBusy(true); setErr({}); try { await api.patch('/api/player/my-profile-level', f); if (photo) { const fd = new FormData(); fd.append('file', photo); await api.upload('/api/player/my-profile-level/photo', fd); } toast.ok('Changes saved.'); setOpen(false); reload(); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  return <div className="space-y-4 max-w-3xl"><PageHeader title="My Profile and Level" action={{ label: 'Edit my profile', icon: Pencil, onClick: edit }} />
    <Card className="flex gap-4 items-center">{p.photo_path ? <AuthImage path={`/api/files/${p.photo_path}`} alt="Your photo" className="h-20 w-20 rounded-full object-cover" /> : <div className="h-20 w-20 rounded-full bg-court/15 flex items-center justify-center text-2xl font-heading text-court">{p.first_name[0]}</div>}
      <div><h2>{p.first_name} {p.last_name}</h2><p className="muted">{p.nickname ? `"${p.nickname}", ` : ''}{p.age !== null ? `${p.age} years old` : 'Add your birthdate'}</p><StatusBadge status={p.status === 'pending_verification' ? 'pending_verification_player' : p.status} label={p.status === 'pending_verification' ? 'Pending check' : undefined} /></div></Card>
    <Card><h2>My level</h2><p className="text-3xl font-bold mt-1">{Number(p.rating).toFixed(2)} <span className="text-lg font-normal capitalize">{p.skill_level}</span></p><p className="muted">{p.level_verified ? 'Level confirmed by the club.' : 'Level not confirmed yet. Staff or a coach can confirm it.'}</p>
      <ul className="mt-2 text-sm muted grid grid-cols-2 gap-1">{data.levels.map(l => <li key={l.key} className="capitalize">{l.key}: {l.range}</li>)}</ul></Card>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Matches', data.stats.matches], ['Wins', data.stats.wins], ['Losses', data.stats.losses], ['Visits', data.stats.visits]].map(([k, v]) => <Card key={k} className="text-center"><p className="text-2xl font-bold">{v}</p><p className="muted">{k}</p></Card>)}</div>
    {data.badges.length > 0 && <Card><h2>Badges</h2><div className="flex flex-wrap gap-2 mt-2">{data.badges.map(b => <span key={b} className="rounded-full bg-volt text-navy px-3 py-1 font-medium">{b}</span>)}</div></Card>}
    <Card><h2>Coming up</h2>{data.upcoming.length ? <ul className="mt-2 space-y-2">{data.upcoming.map(b => <li key={b.id}>{b.date_label}, {b.time_label}, {b.court_label}</li>)}</ul> : <p className="muted mt-1">No upcoming bookings.</p>}</Card>
    <Card><h2>Match history</h2>{data.matches.length ? <ul className="mt-2 space-y-2">{data.matches.map(m => <li key={m.id}>{m.tournament}: {m.date_label ? `${m.date_label}, ${m.time_label}, ${m.court_label}` : 'to be scheduled'}</li>)}</ul> : <p className="muted mt-1">No matches yet.</p>}</Card>
    <Card><h2>Rating history</h2>{hist.data?.history?.length ? <ul className="mt-2 space-y-2">{hist.data.history.map(h => <li key={h.id}>{h.old_rating ?? '-'} to <strong>{h.new_rating}</strong>: {h.reason} <span className="muted">(by {h.changed_by_name})</span></li>)}</ul> : <p className="muted mt-1">Your rating changes will show here.</p>}</Card>
    <Drawer open={open} onClose={() => setOpen(false)} title="Edit my profile" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Save changes</Button></>}>
      <div className="space-y-4"><p className="text-sm muted">Your private details are only seen by you and club staff. We use them as described in the Data Privacy notice.</p>
        <FileUpload label="Profile photo" onChange={setPhoto} />
        {FIELDS.map(([n, l, t, o]) => <FormField key={n} name={n} label={l} type={t === 'textarea' ? undefined : t} textarea={t === 'textarea'} options={o} placeholder={o ? 'Choose' : undefined} value={f[n] ?? ''} onChange={set} error={err[n]} />)}
        <FormField name="skill_level" label="My level (my own opinion)" options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }, { value: 'pro', label: 'Pro' }]} value={f.skill_level} onChange={set} helper="Staff will check it and may adjust it." />
        <FormField name="dominant_hand" label="Playing hand" options={[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }, { value: 'both', label: 'Both' }]} placeholder="Choose" value={f.dominant_hand} onChange={set} error={err.dominant_hand} />
        <FormField name="preferred_format" label="Preferred format" options={[{ value: 'singles', label: 'Singles' }, { value: 'doubles', label: 'Doubles' }, { value: 'mixed', label: 'Mixed doubles' }]} placeholder="Choose" value={f.preferred_format} onChange={set} error={err.preferred_format} />
        {minor && <><FormField name="guardian_name" label="Guardian name" value={f.guardian_name} onChange={set} error={err.guardian_name} /><FormField name="guardian_relationship" label="Guardian relationship" value={f.guardian_relationship} onChange={set} /><FormField name="guardian_contact" label="Guardian contact" type="tel" value={f.guardian_contact} onChange={set} /><FormField type="checkbox" label="My guardian agrees that I can play." value={f.guardian_consent} onChange={e => setF(s => ({ ...s, guardian_consent: e.target.value }))} /></>}
        <FormField type="checkbox" label="I accept the club waiver." value={f.waiver_accepted} onChange={e => setF(s => ({ ...s, waiver_accepted: e.target.value }))} />
        <FormField type="checkbox" label="I agree the club may keep my details (Data Privacy Act)." value={f.privacy_consent} onChange={e => setF(s => ({ ...s, privacy_consent: e.target.value }))} /></div></Drawer></div>;
}
