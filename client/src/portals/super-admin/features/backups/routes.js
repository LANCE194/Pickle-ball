import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'backups', component: lazy(() => import('./pages/BackupsPage.jsx')) }];
