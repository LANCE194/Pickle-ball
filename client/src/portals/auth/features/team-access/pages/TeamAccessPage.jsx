import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../../shared/lib/api';
import { useSession } from '../../../../../shared/hooks/useSession';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import FormField from '../../../../../shared/components/FormField';
const HOME = { admin: '/admin', staff: '/staff', coach_referee: '/referee' };
// Hidden entrance for admin, staff and coach/referee. The server decides who may sign in here; hiding the button is not security.
export default function TeamAccessPage() {
  const { signIn } = useSession(); const nav = useNavigate(); const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const go = async () => { setBusy(true); setErr({}); setMsg(''); try { const r = await api.post('/api/auth/team-access/login', f); await signIn(r); nav(HOME[r.user.role] || '/', { replace: true }); } catch (e) { if (e.fields) setErr(e.fields); else setMsg(e.status === 401 ? 'That did not work. Check your details and try again.' : e.message); } finally { setBusy(false); } };
  return <Card className="max-w-md w-full"><h1>Team login</h1><form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); go(); }}>
    <FormField label="Work email" type="email" name="email" autoComplete="username" value={f.email} onChange={set} error={err.email} placeholder="name@club.com" />
    <FormField label="Password" type="password" name="password" value={f.password} onChange={set} error={err.password} helper="Use the password set when your account was created, or your one-time password after a reset." />
    {msg && <p role="alert" className="text-alert">{msg}</p>}<Button full type="submit" loading={busy}>Log in</Button></form></Card>;
}
