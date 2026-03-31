import { Route, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

const protectedRoute = (
  path: string,
  loadComponent: Route['loadComponent'],
): Route => ({
  path,
  canActivate: [authGuard],
  loadComponent,
});

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./routes/landing-page.component').then(
        (component) => component.LandingPageComponent,
      ),
  },
  protectedRoute('team-selection', () =>
    import('./routes/team-selection-page.component').then(
      (component) => component.TeamSelectionPageComponent,
    ),
  ),
  protectedRoute('picture', () =>
    import('./routes/picture-page.component').then(
      (component) => component.PicturePageComponent,
    ),
  ),
  protectedRoute('picture/:teamId', () =>
    import('./routes/picture-page.component').then(
      (component) => component.PicturePageComponent,
    ),
  ),
  protectedRoute('identity', () =>
    import('./routes/identity-page.component').then(
      (component) => component.IdentityPageComponent,
    ),
  ),
  protectedRoute('card', () =>
    import('./routes/card-page.component').then(
      (component) => component.CardPageComponent,
    ),
  ),
  protectedRoute('quiz', () =>
    import('./routes/quiz-page.component').then(
      (component) => component.QuizPageComponent,
    ),
  ),
  protectedRoute('quiz/:quizId', () =>
    import('./routes/quiz-page.component').then(
      (component) => component.QuizPageComponent,
    ),
  ),
  protectedRoute('swipe-quiz', () =>
    import('./routes/swipe-quiz-page.component').then(
      (component) => component.SwipeQuizPageComponent,
    ),
  ),
  protectedRoute('swipe-quiz/:quizId', () =>
    import('./routes/swipe-quiz-page.component').then(
      (component) => component.SwipeQuizPageComponent,
    ),
  ),
  protectedRoute('image-quiz', () =>
    import('./routes/image-quiz-page.component').then(
      (component) => component.ImageQuizPageComponent,
    ),
  ),
  protectedRoute('image-quiz/:quizId', () =>
    import('./routes/image-quiz-page.component').then(
      (component) => component.ImageQuizPageComponent,
    ),
  ),
  protectedRoute('card-match', () =>
    import('./routes/card-match-page.component').then(
      (component) => component.CardMatchPageComponent,
    ),
  ),
  protectedRoute('card-match/:quizId', () =>
    import('./routes/card-match-page.component').then(
      (component) => component.CardMatchPageComponent,
    ),
  ),
  protectedRoute('drag-drop-quiz', () =>
    import('./routes/drag-drop-quiz-page.component').then(
      (component) => component.DragDropQuizPageComponent,
    ),
  ),
  protectedRoute('drag-drop-quiz/:quizId', () =>
    import('./routes/drag-drop-quiz-page.component').then(
      (component) => component.DragDropQuizPageComponent,
    ),
  ),
  protectedRoute('ranking-quiz', () =>
    import('./routes/ranking-quiz-page.component').then(
      (component) => component.RankingQuizPageComponent,
    ),
  ),
  protectedRoute('ranking-quiz/:quizId', () =>
    import('./routes/ranking-quiz-page.component').then(
      (component) => component.RankingQuizPageComponent,
    ),
  ),
  protectedRoute('results', () =>
    import('./routes/results-page.component').then(
      (component) => component.ResultsPageComponent,
    ),
  ),
  protectedRoute('leaderboard', () =>
    import('./routes/leaderboard-page.component').then(
      (component) => component.LeaderboardPageComponent,
    ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
