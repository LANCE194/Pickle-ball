import { lazy } from 'react';
export default [
  { path: 'tournaments', component: lazy(() => import('./pages/TournamentsPage.jsx')) },
  { path: 'tournaments/:id', component: lazy(() => import('./pages/TournamentDetailPage.jsx')) },
];
