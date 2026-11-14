import DashboardView from '../../../../../shared/components/desk/DashboardView';
export default function DashboardPage() { return <DashboardView admin path="/api/admin/dashboard" links={[{ to: '/admin/payments', label: 'Check payments' }, { to: '/admin/bookings', label: 'Bookings' }, { to: '/admin/courts', label: 'Courts and rates' }, { to: '/admin/reports', label: 'Reports' }]} />; }
