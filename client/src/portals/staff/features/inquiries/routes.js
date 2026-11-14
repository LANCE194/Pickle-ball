import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'inquiries', component: lazy(() => import('./pages/InquiriesPage.jsx')) }];
