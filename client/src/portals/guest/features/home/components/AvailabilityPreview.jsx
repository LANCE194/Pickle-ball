import { useState } from 'react';
import SlotGrid from '../../../../../shared/components/SlotGrid';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import { useApi } from '../../../../../shared/hooks/useApi';
// Read-only live availability for guests: slot colours only, no names, no payments.
export default function AvailabilityPreview({ path = '/api/guest/live-availability', date }) {
  const { data, loading, error, reload } = useApi(path, { date }, { events: ['availability.changed'] });
  if (loading) return <Skeleton lines={4} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <SlotGrid courts={data.courts} selectable={false} />;
}
