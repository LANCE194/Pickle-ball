import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../../shared/lib/api';
import { useSession } from '../../../../../shared/hooks/useSession';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import FormField from '../../../../../shared/components/FormField';
import { SA_PATH } from '../../../../../app/portals';
const API = `/api/${SA_PATH}`;
// Private entrance: password + configured second factor. First login forces a new password and optional second-factor setup.
export default function SuperAdminLoginPage() {
  const { signIn } = useSession(); const nav = useNavigate(); const [stage, setStage] = useState('login'); const [f, setF] = useState({ email: '', password: '', code: '', newPassword: '', confirm: '' }); const [setup, setSetup] = useState({}); const [totp, setTotp] = useState(null); const [err, setErr] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const run = fn => async () => { setBusy(true); setErr({}); setMsg(''); try { await fn(); } catch (e) { if (e.fields) setErr(e.fields); else setMsg(e.status === 401 ? 'That did not work. Check your details and try again.' : e.message); } finally { setBusy(false); } };
  const finish = async r => { await signIn(r); nav(`/${SA_PATH}/console`, { replace: true }); };
  const startTotp = async token => { const r = await api.post(`${API}/setup/totp`, { setupToken: token }); setTotp(r); setStage('totp'); };
  const login = run(async () => { const r = await api.post(`${API}/login`, { email: f.email, password: f.password, code: f.code }); if (r.token) return finish(r); if (r.stage === 'code') return setStage('code'); setSetup(r); if (r.needsPassword) setStage('password'); else await startTotp(r.setupToken); });
  const savePassword = run(async () => { if (f.newPassword !== f.confirm) return setErr({ confirm: 'The two passwords do not match.' }); const r = await api.post(`${API}/setup/password`, { setupToken: setup.setupToken, newPassword: f.newPassword }); if (r.stage === 'totp') await startTotp(setup.setupToken); else { setStage('login'); setMsg(r.message); } });
  const confirm = run(async () => finish(await api.post(`${API}/setup/totp/confirm`, { setupToken: setup.setupToken, code: f.code })));
  return <Card className="max-w-md w-full"><h1>Sign in</h1>
    {stage === 'login' && <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); login(); }}><FormField label="Email" type="email" name="email" value={f.email} onChange={set} error={err.email} /><FormField label="Password" type="password" name="password" value={f.password} onChange={set} error={err.password} />{msg && <p role="alert" className="text-alert">{msg}</p>}<Button full type="submit" loading={busy}>Continue</Button></form>}
    {stage === 'code' && <div className="mt-4 space-y-4"><FormField label="6-digit code from your authenticator app" name="code" inputMode="numeric" maxLength={6} value={f.code} onChange={set} error={err.code} />{msg && <p role="alert" className="text-alert">{msg}</p>}<Button full loading={busy} onClick={login}>Log in</Button></div>}
    {stage === 'password' && <div className="mt-4 space-y-4"><p className="muted">First login: choose a new password.</p><FormField label="New password" type="password" name="newPassword" autoComplete="new-password" value={f.newPassword} onChange={set} error={err.newPassword} helper="At least 8 characters with a letter and a number." /><FormField label="Type it again" type="password" name="confirm" autoComplete="new-password" value={f.confirm} onChange={set} error={err.confirm} /><Button full loading={busy} onClick={savePassword}>Save password</Button></div>}
    {stage === 'totp' && totp && <div className="mt-4 space-y-4"><p>Add this account to your authenticator app. Enter the key by hand (or open the link on your phone).</p><p className="font-mono break-all rounded-card border line p-3 select-all">{totp.secret}</p><p className="text-sm muted break-all">{totp.uri}</p><FormField label="Then type the 6-digit code" name="code" inputMode="numeric" maxLength={6} value={f.code} onChange={set} error={err.code} />{msg && <p role="alert" className="text-alert">{msg}</p>}<Button full loading={busy} onClick={confirm}>Finish setup</Button></div>}</Card>;
}
