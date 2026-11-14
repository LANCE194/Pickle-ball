import { lazy } from 'react';
// Each route is lazy loaded so a role only downloads the screens it opens.
export default [{ path: 'player-login', component: lazy(() => import('./pages/PlayerLoginPage.jsx')) }];
