import { lazy } from 'react';
export default [
  { path: 'payments', component: lazy(() => import('./pages/PaymentsPage.jsx')) },
  { path: 'payments/:id', component: lazy(() => import('./pages/PayPage.jsx')) },
];
