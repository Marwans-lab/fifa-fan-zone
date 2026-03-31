import { Routes } from '@angular/router'
import { authGuard } from './auth.guard'

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'team-selection',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/team-selection.component').then(m => m.TeamSelectionComponent),
  },
  {
    path: 'picture',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/picture.component').then(m => m.PictureComponent),
  },
  {
    path: 'identity',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/identity.component').then(m => m.IdentityComponent),
  },
  {
    path: 'card',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card.component').then(m => m.CardComponent),
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/quiz.component').then(m => m.QuizComponent),
  },
  {
    path: 'swipe-quiz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/swipe-quiz.component').then(m => m.SwipeQuizComponent),
  },
  {
    path: 'card-match',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/card-match.component').then(m => m.CardMatchComponent),
  },
  {
    path: 'ranking-quiz',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ranking-quiz.component').then(m => m.RankingQuizComponent),
  },
  {
    path: 'results',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/leaderboard.component').then(m => m.LeaderboardComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
]
