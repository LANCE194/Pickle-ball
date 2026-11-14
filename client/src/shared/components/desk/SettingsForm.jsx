import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import PageHeader from '../PageHeader';
import Card from '../Card';
import FormField from '../FormField';
import Skeleton from '../Skeleton';
import ErrorPanel from '../ErrorPanel';
const LABELS = { club_name: ['Club name', 'text'], booking_hold_minutes: ['Hold a booking for (minutes)', 'number'], cancellation_cutoff_hours: ['Players can cancel up to (hours before)', 'number'], tournament_rest_minutes: ['Rest between tournament matches (minutes)', 'number'], membership_reminder_days: ['Remind members before expiry (days)', 'number'], booking_reminder_hours: ['Booking reminder (hours before)', 'number'], min_booking_hours: ['Shortest booking (hours)', 'number'], max_booking_hours: ['Longest booking (hours)', 'number'], opening_time: ['Opening time', 'time'], closing_time: ['Closing time', 'time'], peak_start: ['Peak starts', 'time'], peak_end: ['Peak ends', 'time'], failed_login_limit: ['Wrong passwords before a lock', 'number'], lock_minutes: ['Lock lasts (minutes)', 'number'], session_idle_minutes: ['Sign out after idle (minutes)', 'number'], image_limit_mb: ['Picture size limit (MB)', 'number'] };
/** Editable settings (defaults live in the database, never hard-coded). Used by Admin and Super Admin. */
export default function SettingsForm({ base, title }) {
  const toast = useToast(); const { data, loading, error, reload } = useApi(base); const [f, setF] = useState({}); const [err, setErr] = useState({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF(data); }, [data]);
  const save = async () => { setBusy(true); setErr({}); try { await api.put(base, f); toast.ok('Settings saved.'); reload(); } catch (e) { setErr(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); } };
  if (loading) return <Skeleton lines={6} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <><PageHeader title={title} action={{ label: 'Save changes', onClick: save, loading: busy }} /><Card className="max-w-2xl grid gap-4 sm:grid-cols-2">{Object.keys(data).map(k => <FormField key={k} label={LABELS[k]?.[0] || k} type={LABELS[k]?.[1] || 'text'} value={f[k] ?? ''} onChange={e => setF(s => ({ ...s, [k]: e.target.value }))} error={err[k]} />)}</Card></>;
}
