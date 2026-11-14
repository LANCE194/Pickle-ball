import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'find-players', component: lazy(() => import('./pages/FindPlayersPage.jsx')) }];
