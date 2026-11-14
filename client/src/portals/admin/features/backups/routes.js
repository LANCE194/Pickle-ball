import { lazy } from 'react';

export default [{ path: 'backups', component: lazy(() => import('./pages/BackupsPage.jsx')) }];
