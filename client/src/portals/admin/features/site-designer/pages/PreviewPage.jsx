import { useParams } from 'react-router-dom';
import { useApi } from '../../../../../shared/hooks/useApi';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import SitePreview from '../../../../../shared/components/SitePreview';
// Private preview link: needs a login and expires after an hour.
export default function PreviewPage() {
  const { token } = useParams(); const { data, loading, error, reload } = useApi(`/api/admin/site-designer/preview/${token}`);
  if (loading) return <Skeleton lines={6} />; if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <div><p className="muted mb-2">Private preview. This is not live.</p><SitePreview config={data.config} /></div>;
}
