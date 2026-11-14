import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useFeature } from '../../../../../shared/hooks/useFeature';
import { useToast } from '../../../../../shared/components/Toast';
import AuthImage from '../../../../../shared/components/AuthImage';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import FileUpload from '../../../../../shared/components/FileUpload';
import FormField from '../../../../../shared/components/FormField';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import StatusBadge from '../../../../../shared/components/StatusBadge';
/** Pay screen: the QR, the exact amount, a reference code, then 3 taps: choose picture, type reference, Send. */
export default function PayPage() {
  const { id } = useParams(); const nav = useNavigate(); const toast = useToast(); const qrOn = useFeature('qr_payments'); const courtOn = useFeature('pay_at_court');
  const { data, loading, error, reload } = useApi(`/api/player/payments/${id}`, null, { events: ['notification.new'] });
  const [file, setFile] = useState(null); const [ref, setRef] = useState(''); const [qr, setQr] = useState(''); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false);
  if (loading) return <Skeleton lines={5} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  const p = data.payment; const active = qr || data.qr_codes[0]?.id;
  const send = async () => { setBusy(true); setErr({}); try { const f = new FormData(); if (!file) throw Object.assign(new Error('x'), { fields: { file: 'Choose the screenshot of your payment.' } }); f.append('file', file); f.append('reference_no', ref); if (active) f.append('qr_id', active); const r = await api.upload(`/api/player/payments/${id}/proof`, f); toast.ok(r.message); nav('/app/schedule'); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  const atCourt = async () => { setBusy(true); try { const r = await api.post(`/api/player/payments/${id}/pay-at-court`); toast.ok(r.message); nav('/app/schedule'); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const canPay = ['unpaid', 'rejected'].includes(p.status);
  return <div className="max-w-2xl space-y-4 pb-24"><Link to="/app/payments">Back to payments</Link><h1>Pay for your booking</h1>
    <Card className="space-y-1"><div className="flex justify-between"><p className="text-3xl font-bold">{p.amount_label}</p><StatusBadge status={p.status} /></div>{p.schedule_line && <p className="text-lg">{p.schedule_line}</p>}<p>Reference code: <strong className="font-mono">{p.reference_code}</strong></p>{p.status === 'rejected' && <p className="text-alert">Payment not accepted. Reason: {p.reject_reason}</p>}{p.expires_at && p.status === 'unpaid' && <p className="muted">Held for you until {new Date(p.expires_at).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true })}.</p>}</Card>
    {!canPay && <Card><p>{p.status_text}</p></Card>}
    {canPay && qrOn && <><Card className="space-y-3"><h2>1. Scan and pay the exact amount</h2>{data.qr_codes.length === 0 ? <p className="muted">The club has no QR code turned on. Please ask the front desk.</p> : <>
      {data.qr_codes.length > 1 && <div className="flex flex-wrap gap-2">{data.qr_codes.map(q => <Button key={q.id} variant={active === q.id ? 'primary' : 'secondary'} onClick={() => setQr(q.id)}>{q.provider.toUpperCase()}</Button>)}</div>}
      {data.qr_codes.filter(q => q.id === active).map(q => <div key={q.id} className="text-center"><AuthImage path={`/api/player/payments/qr/${q.id}/image`} alt={`${q.provider} QR code`} className="mx-auto max-w-[280px] w-full rounded-card" /><p className="mt-2 font-medium">{q.account_name}</p><p className="muted">{q.account_number}</p></div>)}</>}</Card>
      <Card className="space-y-4"><h2>2. Send your proof</h2><FileUpload label="Screenshot of your payment" helper="JPG or PNG, up to 5 MB." onChange={setFile} error={err.file} /><FormField label="Reference number from your receipt" value={ref} onChange={e => setRef(e.target.value)} error={err.reference_no} placeholder="For example 1234 567 890" /><Button variant="book" full loading={busy} onClick={send}>Send payment proof</Button></Card></>}
    {canPay && courtOn && <Card><h2>Prefer to pay at the court?</h2><p className="muted mt-1">Your booking is confirmed now. Pay at the front desk when you arrive.</p><div className="mt-3"><Button variant="secondary" loading={busy} onClick={atCourt}>I will pay at the court</Button></div></Card>}</div>;
}
