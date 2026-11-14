import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import FormField from '../../../../../shared/components/FormField';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import EmptyState from '../../../../../shared/components/EmptyState';
import { peso, todayManila } from '../../../../../shared/lib/format';
const B = '/api/admin/reports';
export default function ReportsPage() {
  const toast = useToast(); const [period, setPeriod] = useState('daily'); const [date, setDate] = useState(todayManila()); const { data, loading, error, reload } = useApi(`${B}/${period}`, { date });
  const dl = (ext) => api.download(`${B}/${period}/export.${ext}`.replace(/$/, `?date=${date}`), `dinknest-${period}.${ext}`).catch(e => toast.error(e.message));
  return <><PageHeader title="Reports" action={{ label: 'Download Excel', onClick: () => dl('xlsx') }} />
    <div className="flex flex-wrap gap-2 items-end mb-4">{[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']].map(([k, l]) => <Button key={k} variant={period === k ? 'primary' : 'secondary'} onClick={() => setPeriod(k)}>{l}</Button>)}<FormField label="Up to" type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="w-48" /><Button variant="secondary" onClick={() => dl('pdf')}>Download PDF</Button></div>
    {loading ? <Skeleton lines={5} /> : error ? <ErrorPanel error={error} onRetry={reload} /> : <div className="space-y-4"><p className="muted">{data.label}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Bookings', data.totals.bookings], ['Confirmed', data.totals.confirmed], ['Cancelled or ended', data.totals.cancelled], ['Revenue', peso(data.revenue)]].map(([k, v]) => <Card key={k}><p className="muted">{k}</p><p className="text-2xl font-bold">{v}</p></Card>)}</div>
      {!data.bookings.length ? <EmptyState title="No bookings in this time" text="Pick another day or period." /> : <Card className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="py-2">Date</th><th>Time</th><th>Court</th><th>Player</th><th>Status</th><th className="text-right">Price</th></tr></thead><tbody>{data.bookings.map((b, i) => <tr key={i} className="border-t line"><td className="py-2 pr-3">{b.date_label}</td><td className="pr-3">{b.time_label}</td><td className="pr-3">{b.court_label}</td><td className="pr-3">{b.player}</td><td className="pr-3 capitalize">{b.status}</td><td className="text-right">{b.price_label}</td></tr>)}</tbody></table></Card>}</div>}</>;
}
