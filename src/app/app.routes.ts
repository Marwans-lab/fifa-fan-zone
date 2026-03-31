import { Routes } from '@angular/router'
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'team-selection',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/team-selection/team-selection.page').then((m) => m.TeamSelectionPage),
  },
  {
    path: 'picture',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/picture/picture.page').then((m) => m.PicturePage),
  },
  {
    path: 'identity',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/identity/identity.page').then((m) => m.IdentityPage),
  },
  {
    path: 'card',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card/card.page').then((m) => m.CardPage),
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/quiz/quiz.page').then((m) => m.QuizPage),
  },
  {
    path: 'swipe-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/swipe-quiz/swipe-quiz.page').then((m) => m.SwipeQuizPage),
  },
  {
    path: 'image-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/image-quiz/image-quiz.page').then((m) => m.ImageQuizPage),
  },
  {
    path: 'card-match',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card-match/card-match.page').then((m) => m.CardMatchPage),
  },
  {
    path: 'drag-drop-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/drag-drop-quiz/drag-drop-quiz.page').then((m) => m.DragDropQuizPage),
  },
  {
    path: 'ranking-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ranking-quiz/ranking-quiz.page').then((m) => m.RankingQuizPage),
  },
  {
    path: 'results',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/results/results.page').then((m) => m.ResultsPage),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
]
