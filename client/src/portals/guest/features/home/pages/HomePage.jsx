import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import { useApi } from '../../../../../shared/hooks/useApi';
import SitePreview from '../../../../../shared/components/SitePreview';
import AvailabilityPreview from '../components/AvailabilityPreview';
/** Landing page: renders the LIVE site design (sections in the approved order). Never a draft. */
export default function HomePage({ onBook }) {
  const { data, loading, error, reload } = useApi('/api/guest/home', null, { events: ['site.deployed', 'availability.changed'] });
  if (loading) return <div className="p-6"><Skeleton lines={6} /></div>; if (error) return <div className="p-6 max-w-page mx-auto"><ErrorPanel error={error} onRetry={reload} /></div>;
  return <SitePreview
    config={data.config}
    courts={data.courts || []}
    events={data.events || []}
    availability={<AvailabilityPreview />}
    onBook={onBook}
    isLive
  />;
}
