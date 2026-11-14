import DashboardView from '../../../../../shared/components/desk/DashboardView';
export default function DashboardPage() { return <DashboardView path="/api/staff/dashboard" links={[{ to: '/staff/payment-queue', label: 'Open payment queue' }, { to: '/staff/bookings', label: 'Open bookings' }]} />; }
