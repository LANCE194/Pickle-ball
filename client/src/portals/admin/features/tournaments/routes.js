import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'tournaments', component: lazy(() => import('./pages/TournamentsPage.jsx')) }];
