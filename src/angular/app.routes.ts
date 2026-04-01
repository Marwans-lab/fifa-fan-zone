import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.page').then(m => m.LandingPage),
  },
  {
    path: 'team-selection',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/team-selection.page').then(m => m.TeamSelectionPage),
  },
  {
    path: 'picture',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/picture.page').then(m => m.PicturePage),
  },
  {
    path: 'picture/:teamId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/picture.page').then(m => m.PicturePage),
  },
  {
    path: 'identity',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/identity.page').then(m => m.IdentityPage),
  },
  {
    path: 'card',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card.page').then(m => m.CardPage),
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/quiz.page').then(m => m.QuizPage),
  },
  {
    path: 'quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/quiz.page').then(m => m.QuizPage),
  },
  {
    path: 'swipe-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/swipe-quiz.page').then(m => m.SwipeQuizPage),
  },
  {
    path: 'swipe-quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/swipe-quiz.page').then(m => m.SwipeQuizPage),
  },
  {
    path: 'image-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/image-quiz.page').then(m => m.ImageQuizPage),
  },
  {
    path: 'image-quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/image-quiz.page').then(m => m.ImageQuizPage),
  },
  {
    path: 'card-match',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card-match.page').then(m => m.CardMatchPage),
  },
  {
    path: 'card-match/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card-match.page').then(m => m.CardMatchPage),
  },
  {
    path: 'drag-drop-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/drag-drop-quiz.page').then(m => m.DragDropQuizPage),
  },
  {
    path: 'drag-drop-quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/drag-drop-quiz.page').then(m => m.DragDropQuizPage),
  },
  {
    path: 'ranking-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ranking-quiz.page').then(m => m.RankingQuizPage),
  },
  {
    path: 'ranking-quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ranking-quiz.page').then(m => m.RankingQuizPage),
  },
  {
    path: 'results',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/results.page').then(m => m.ResultsPage),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/leaderboard.page').then(m => m.LeaderboardPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
