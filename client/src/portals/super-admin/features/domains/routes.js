import { lazy } from 'react';

export default [{ path: 'domains', component: lazy(() => import('./pages/DomainsPage.jsx')) }];
