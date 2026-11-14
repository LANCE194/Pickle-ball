import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'courts', component: lazy(() => import('./pages/CourtsRatesPage.jsx')) }];
