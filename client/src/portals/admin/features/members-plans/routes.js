import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'members', component: lazy(() => import('./pages/MembersPlansPage.jsx')) }];
