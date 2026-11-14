import { lazy } from 'react';

export default [{
  path: 'site-designer',
  component: lazy(() => import('../../../admin/features/site-designer/pages/SiteDesignerPage.jsx')),
}];
