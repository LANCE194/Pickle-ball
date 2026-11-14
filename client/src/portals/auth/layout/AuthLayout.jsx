import { Outlet, Link } from 'react-router-dom';
// Centered card layout for the login screens. Nothing here links to team or super admin entrances.
export default function AuthLayout() {
  return <div className="min-h-screen flex flex-col"><header className="px-4 py-4"><Link to="/" className="font-heading font-bold text-xl text-court dark:text-volt no-underline">DinkNest</Link></header>
    <main className="flex-1 flex items-start md:items-center justify-center px-4 pb-10"><Outlet /></main></div>;
}
