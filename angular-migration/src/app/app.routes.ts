import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'team-selection',
    loadComponent: () =>
      import('./pages/team-selection/team-selection.component').then(
        (m) => m.TeamSelectionComponent
      ),
  },
  {
    path: 'picture',
    loadComponent: () =>
      import('./pages/picture/picture.component').then((m) => m.PictureComponent),
  },
  {
    path: 'identity',
    loadComponent: () =>
      import('./pages/identity/identity.component').then((m) => m.IdentityComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
