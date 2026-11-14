import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'feature-control', component: lazy(() => import('./pages/FeatureControlPage.jsx')) }];
