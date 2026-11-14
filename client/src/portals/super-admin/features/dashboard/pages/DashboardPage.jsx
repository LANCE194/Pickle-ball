import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../../../../shared/components/Card';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import PageHeader from '../../../../../shared/components/PageHeader';
import Skeleton from '../../../../../shared/components/Skeleton';
import { useApi } from '../../../../../shared/hooks/useApi';
import { colors } from '../../../../../shared/theme/tokens';

function Metric({ label, value }) {
  return <Card><p className="muted">{label}</p><p className="mt-1 text-3xl font-bold">{value ?? 0}</p></Card>;
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi('/api/super-admin/dashboard', null, { events: ['booking.changed', 'site.deployed'] });
  if (loading) return <Skeleton lines={5} />;
  if (error) return <ErrorPanel error={error} onRetry={reload} />;

  return <div className="space-y-4">
    <PageHeader title="Platform dashboard" subtitle="Platform-wide activity and account health. Personal player data is not displayed." />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Active clubs" value={data.active_clubs} />
      <Metric label="Total clubs" value={data.total_clubs} />
      <Metric label="Active admins" value={data.active_admins} />
      <Metric label="Active users" value={data.active_users} />
    </div>
    <Card>
      <h2 className="mb-2">Platform bookings, last 14 days ({data.bookings_14d})</h2>
      {data.bookings_chart.length
        ? <div className="h-64" role="img" aria-label="Platform bookings chart">
          <ResponsiveContainer><BarChart data={data.bookings_chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={date => date.slice(5)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="bookings" fill={colors.court} />
          </BarChart></ResponsiveContainer>
        </div>
        : <p className="muted">No booking activity in the last 14 days.</p>}
    </Card>
  </div>;
}
