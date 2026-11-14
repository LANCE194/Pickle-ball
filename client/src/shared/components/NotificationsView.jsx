import { Bell } from '../lib/icons';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from './Card';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import ErrorPanel from './ErrorPanel';
export default function NotificationsView({ path }) {
  const { onNotificationClick } = useOutletContext() || {};
  const { data, loading, error, reload } = useApi(path, null, { events: ['notification.new'] });
  useEffect(() => { if (data?.unread) api.post(path + '/read').catch(() => {}); }, [data?.unread, path]);
  return <><PageHeader title="Notifications" />{loading ? <Skeleton /> : error ? <ErrorPanel error={error} onRetry={reload} /> : !data.items.length ? <EmptyState icon={Bell} title="No notifications yet" text="Booking and payment updates will show up here." />
    : <ul className="space-y-3 max-w-2xl">{data.items.filter(n => n.kind !== 'otp').map(n => <li key={n.id}><Card className={n.read_at ? '' : 'border-court'}><button type="button" onClick={() => onNotificationClick?.(n)} className="w-full text-left rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-court"><p className="font-medium">{n.title}</p><p className="muted">{n.body}</p><p className="text-sm muted mt-1">{n.date_label}, {n.time_label}</p></button></Card></li>)}</ul>}</>;
}
