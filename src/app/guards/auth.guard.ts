import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureAuth();
  const token = await authService.fetchAuthToken();

  if (token) {
    return true;
  }

  return router.parseUrl('/auth-unavailable');
};
