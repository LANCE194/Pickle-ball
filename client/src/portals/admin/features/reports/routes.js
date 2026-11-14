import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'reports', component: lazy(() => import('./pages/ReportsPage.jsx')) }];
