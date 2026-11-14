import { lazy } from 'react';
export default [
  { path: 'tournaments', component: lazy(() => import('./pages/PublicTournamentsPage.jsx')) },
  { path: 'tournaments/:id', component: lazy(() => import('./pages/TournamentDetailPage.jsx')) },
];
