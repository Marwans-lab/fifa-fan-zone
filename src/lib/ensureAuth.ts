import { authService } from '../app/services/service-instances';

export function ensureAuth(): Promise<void> {
  return authService.ensureAuth();
}
