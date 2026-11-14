import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import FormField from '../../../../../shared/components/FormField';
import Skeleton from '../../../../../shared/components/Skeleton';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useFeature } from '../../../../../shared/hooks/useFeature';
const AGE = ['Under 18', '18 to 24', '25 to 34', '35 to 49', '50 and over'];
const INTEREST = [{ value: 'booking', label: 'Booking a court' }, { value: 'tournament', label: 'Tournaments' }, { value: 'membership', label: 'Membership' }, { value: 'other', label: 'Something else' }];
export default function AboutContactInquiryPage() {
  const { data, loading } = useApi('/api/guest/about-contact-inquiry'); const inquiries = useFeature('inquiries');
  const [f, setF] = useState({ name: '', age_range: '', contact: '', interest: '', message: '', consent: false }); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState('');
  const set = e => setF(s => ({ ...s, [e.target.name]: e.target.value }));
  const send = async () => { setBusy(true); setErr({}); try { const r = await api.post('/api/guest/about-contact-inquiry/inquiry', f); setDone(r.message); } catch (e) { setErr(e.fields || { message: e.message }); } finally { setBusy(false); } };
  const a = data?.about;
  return <div className="max-w-page mx-auto px-4 py-6 grid gap-6 md:grid-cols-2"><div className="space-y-4"><h1>About and Contact</h1>{loading ? <Skeleton /> : a && <Card><p>{a.text}</p>{a.address && <p className="mt-2">{a.address}</p>}{a.phone && <p>{a.phone}</p>}{a.email && <p>{a.email}</p>}</Card>}
    {a?.mapQuery && <div className="rounded-card overflow-hidden"><iframe title="Map to the club" className="w-full h-72 border-0" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(a.mapQuery)}&output=embed`} /></div>}</div>
    {inquiries && <Card>{done ? <div><h2>Thank you</h2><p className="mt-2">{done}</p></div> : <div className="space-y-4"><h2>Send us a message</h2>
      <FormField label="Your name" name="name" value={f.name} onChange={set} error={err.name} required placeholder="Maria Santos" />
      <FormField label="Your age" name="age_range" options={AGE} placeholder="Choose (optional)" value={f.age_range} onChange={set} />
      <FormField label="Mobile number or email" name="contact" value={f.contact} onChange={set} error={err.contact} required helper="So we can reply." placeholder="0917 123 4567" />
      <FormField label="What are you interested in?" name="interest" options={INTEREST} placeholder="Choose one" value={f.interest} onChange={set} error={err.interest} required />
      <FormField label="Message" name="message" textarea value={f.message} onChange={set} error={err.message} placeholder="How can we help?" />
      <FormField type="checkbox" label="I agree that the club may use these details to reply to me." helper={data?.privacy_notice} value={f.consent} onChange={e => setF(s => ({ ...s, consent: e.target.value }))} error={err.consent} />
      <Button full loading={busy} onClick={send}>Send message</Button></div>}</Card>}</div>;
}
