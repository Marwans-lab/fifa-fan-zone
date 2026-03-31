import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./home.component').then((component) => component.HomeComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
