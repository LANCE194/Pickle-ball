import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import Button from './Button';
import Card from './Card';
import FormField from './FormField';
import Stepper from './Stepper';
// Player Login and the 3-screen activation (contact, code, password). Used by the guest login page and the auth folder.
const useGoBack = () => { const nav = useNavigate(); const loc = useLocation(); return () => nav(loc.state?.from || '/app', { replace: true }); };
export function PlayerLoginForm({ onActivate }) {
  const { signIn } = useSession(); const back = useGoBack(); const [f, setF] = useState({ identifier: '', password: '' }); const [err, setErr] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [forgot, setForgot] = useState(false);
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const go = async () => { setBusy(true); setErr({}); setMsg(''); try { const r = await api.post('/api/auth/player-login/login', f); await signIn(r); back(); } catch (e) { if (e.fields) setErr(e.fields); else setMsg(e.status === 401 ? 'That did not work. Check your details and try again.' : e.message); } finally { setBusy(false); } };
  if (forgot) return <ForgotPassword onDone={() => setForgot(false)} />;
  return <Card className="max-w-md w-full mx-auto"><h1>Player Login</h1><p className="muted mt-1">Log in with your mobile number or email.</p>
    <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); go(); }}>
      <FormField label="Mobile number or email" name="identifier" autoComplete="username" value={f.identifier} onChange={set} error={err.identifier} placeholder="0917 123 4567" helper="Use the contact the club has on file." />
      <FormField label="Password" type="password" name="password" value={f.password} onChange={set} error={err.password} />
      {msg && <p role="alert" className="text-alert">{msg}</p>}
      <Button full type="submit" loading={busy}>Log in</Button></form>
    <div className="mt-4 flex flex-col gap-2"><Button variant="secondary" full onClick={onActivate}>First time here? Set up your account</Button><Button variant="ghost" full onClick={() => setForgot(true)}>I forgot my password</Button></div>
    <p className="text-sm muted mt-4">Not added yet? Ask the club front desk to add you.</p></Card>;
}
function ForgotPassword({ onDone }) {
  const [step, setStep] = useState(0); const [f, setF] = useState({ contact: '', code: '', password: '' }); const [err, setErr] = useState({}); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false); const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const run = async fn => { setBusy(true); setErr({}); try { await fn(); } catch (e) { setErr(e.fields || { contact: e.message }); } finally { setBusy(false); } };
  return <Card className="max-w-md w-full mx-auto"><h1>Reset your password</h1>
    {step === 0 ? <div className="mt-4 space-y-4"><FormField label="Mobile number or email" name="contact" value={f.contact} onChange={set} error={err.contact} /><Button full loading={busy} onClick={() => run(async () => { const r = await api.post('/api/auth/player-login/forgot', { contact: f.contact }); setInfo(r.message); setStep(1); })}>Send me a code</Button></div>
      : <div className="mt-4 space-y-4"><p className="muted">{info}</p><FormField label="6-digit code" name="code" inputMode="numeric" maxLength={6} value={f.code} onChange={set} error={err.code} /><FormField label="New password" type="password" name="password" autoComplete="new-password" value={f.password} onChange={set} error={err.password} helper="At least 8 characters with a letter and a number." /><Button full loading={busy} onClick={() => run(async () => { await api.post('/api/auth/player-login/reset', { contact: f.contact, code: f.code, password: f.password }); onDone(); })}>Save new password</Button></div>}
    <div className="mt-3"><Button variant="ghost" full onClick={onDone}>Back to login</Button></div></Card>;
}
export function ActivationFlow({ onLogin }) {
  const { signIn } = useSession(); const back = useGoBack(); const [step, setStep] = useState(0); const [f, setF] = useState({ contact: '', code: '', password: '' }); const [err, setErr] = useState({}); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false); const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const run = async fn => { setBusy(true); setErr({}); try { await fn(); } catch (e) { setErr(e.fields || { [step === 0 ? 'contact' : step === 1 ? 'code' : 'password']: e.message }); } finally { setBusy(false); } };
  return <Card className="max-w-md w-full mx-auto"><h1>First time here? Set up your account</h1><div className="mt-4"><Stepper steps={['Contact', 'Code', 'Password']} current={step} /></div>
    {step === 0 && <div className="space-y-4"><FormField label="Mobile number or email" name="contact" value={f.contact} onChange={set} error={err.contact} helper="Use the contact the club has on file for you." placeholder="0917 123 4567" /><Button full loading={busy} onClick={() => run(async () => { const r = await api.post('/api/auth/activation/request', { contact: f.contact }); setInfo(r.message); setStep(1); })}>Send me a code</Button></div>}
    {step === 1 && <div className="space-y-4"><p className="muted">{info}</p><FormField label="6-digit code" name="code" inputMode="numeric" maxLength={6} value={f.code} onChange={set} error={err.code} helper="The code works for 10 minutes." /><Button full onClick={() => (/^\d{6}$/.test(f.code) ? setStep(2) : setErr({ code: 'Type the 6-digit code.' }))}>Continue</Button></div>}
    {step === 2 && <div className="space-y-4"><FormField label="Choose a password" type="password" name="password" autoComplete="new-password" value={f.password} onChange={set} error={err.password} helper="At least 8 characters with a letter and a number." /><Button full loading={busy} onClick={() => run(async () => { try { const r = await api.post('/api/auth/activation/verify', f); await signIn(r); back(); } catch (e) { if (e.code === 'BAD_CODE') setStep(1); throw e; } })}>Save and log in</Button></div>}
    <div className="mt-3"><Button variant="ghost" full onClick={onLogin}>I already have an account</Button></div></Card>;
}
