import { lazy } from 'react';
export default [{ path: 'messages', component: lazy(() => import('./pages/ChatPage.jsx')) }];
