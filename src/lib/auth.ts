import { authService } from '../app/services/service-instances';
import { type AuthState, type AuthStatus } from '../app/services/auth.service';

export type { AuthStatus, AuthState };

/** Attempt to get auth token with timeout + backoff. Never throws. */
export async function fetchAuthToken(): Promise<string | null> {
  return authService.fetchAuthToken();
}

/**
 * Check if a token should be considered expired.
 * TODO: replace stub logic with real JWT `exp` claim validation.
 */
export function isTokenExpired(token: string | null): boolean {
  return authService.isTokenExpired(token);
}
