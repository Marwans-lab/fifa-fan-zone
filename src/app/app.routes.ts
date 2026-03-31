import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home.component').then((component) => component.HomeComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
