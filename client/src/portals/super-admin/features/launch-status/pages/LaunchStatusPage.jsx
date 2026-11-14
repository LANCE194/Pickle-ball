import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import Skeleton from '../../../../../shared/components/Skeleton';
export default function LaunchStatusPage() {
  const toast = useToast(); const { data, loading, reload } = useApi('/api/super-admin/launch-status', null, { events: ['site.deployed'] });
  const set = async s => { try { await api.put('/api/super-admin/launch-status', { status: s }); toast.ok(s === 'live' ? 'The website is live.' : 'The public now sees Coming Soon.'); reload(); } catch (e) { toast.error(e.message); } };
  if (loading) return <Skeleton />; const live = data.launch_status === 'live';
  return <><PageHeader title="Launch status" subtitle="Before launch, the public sees a Coming Soon page. Admin and staff can still preview the site." /><Card className="max-w-lg space-y-3"><div className="flex items-center justify-between gap-2"><h2>Website is</h2><StatusBadge status={live ? 'live' : 'draft'} label={live ? 'Live' : 'Coming soon'} /></div><Button variant={live ? 'secondary' : 'primary'} onClick={() => set(live ? 'pre_launch' : 'live')}>{live ? 'Switch back to Coming Soon' : 'Launch the website'}</Button></Card></>;
}
