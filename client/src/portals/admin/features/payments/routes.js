import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'payments', component: lazy(() => import('./pages/PaymentsPage.jsx')) }];
