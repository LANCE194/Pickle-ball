import { lazy } from 'react';
export default [
  { path: 'site-designer', component: lazy(() => import('./pages/SiteDesignerPage.jsx')) },
  { path: 'site-designer/preview/:token', component: lazy(() => import('./pages/PreviewPage.jsx')) },
];
