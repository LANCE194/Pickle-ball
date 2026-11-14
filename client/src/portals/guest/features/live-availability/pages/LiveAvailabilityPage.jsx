import { useState } from 'react';
import Button from '../../../../../shared/components/Button';
import SlotGrid from '../../../../../shared/components/SlotGrid';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import { useApi } from '../../../../../shared/hooks/useApi';
import { todayManila, addDays, dayLabel } from '../../../../../shared/lib/format';
export default function LiveAvailabilityPage({ onBook }) {
  const [date, setDate] = useState(todayManila());
  const { data, loading, error, reload } = useApi('/api/guest/live-availability', { date }, { events: ['availability.changed'] });
  return <div className="max-w-page mx-auto px-4 py-6 space-y-4"><h1>Schedule</h1><p className="muted">Blue times are free. To book, tap Book Now.</p>
    <div className="flex items-center gap-2"><Button variant="secondary" onClick={() => setDate(addDays(date, -1))} disabled={date <= todayManila()}>Back</Button><strong className="flex-1 text-center">{dayLabel(date)}</strong><Button variant="secondary" onClick={() => setDate(addDays(date, 1))}>Next day</Button></div>
    {loading ? <Skeleton lines={5} /> : error ? <ErrorPanel error={error} onRetry={reload} /> : <SlotGrid courts={data.courts} selectable={false} />}
    <Button variant="book" onClick={onBook}>Book Now</Button></div>;
}
