/**
 * Auth layer — wraps QAApp.getAuthToken() with:
 * - in-memory token storage (never persisted to localStorage)
 * - 5-second timeout per attempt to prevent infinite loading
 * - exponential backoff retry (max 3 attempts: delays 1s, 2s)
 * - token expiry detection (stub — TODO: replace with real JWT validation)
 * - silent re-fetch on expiry
 * - analytics events: auth_timeout (per attempt), auth_failed (all failed)
 */
import { track } from './analytics'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  token: string | null
  status: AuthStatus
}

export const TOKEN_TIMEOUT_MS  = 5_000
export const AUTH_MAX_ATTEMPTS = 3
const TOKEN_MAX_AGE_MS         = 24 * 60 * 60 * 1_000 // 24h fallback

let _tokenFetchedAt: number | null = null

/** Single attempt with hard timeout. Returns null and tracks on timeout. */
async function singleAttempt(attempt: number): Promise<string | null> {
  try {
    const tokenPromise =
      window.QAApp?.getAuthToken() ??
      Promise.reject(new Error('QAApp not available'))

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), TOKEN_TIMEOUT_MS)
    )

    const token = await Promise.race([tokenPromise, timeoutPromise])
    _tokenFetchedAt = Date.now()
    return token
  } catch (err) {
    if (err instanceof Error && err.message === 'Auth timeout') {
      track('auth_timeout', { attempt })
    }
    return null
  }
}

/** Exponential backoff: attempt 1→1s, attempt 2→2s (before attempt 3). */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch auth token with exponential backoff retry.
 * Attempts up to AUTH_MAX_ATTEMPTS times (delays: 1s then 2s between).
 * Tracks auth_failed after all attempts are exhausted. Never throws.
 */
export async function fetchAuthToken(): Promise<string | null> {
  for (let attempt = 1; attempt <= AUTH_MAX_ATTEMPTS; attempt++) {
    const token = await singleAttempt(attempt)
    if (token) return token
    if (attempt < AUTH_MAX_ATTEMPTS) {
      await delay(Math.pow(2, attempt - 1) * 1_000) // 1s, then 2s
    }
  }
  track('auth_failed', { attempts: AUTH_MAX_ATTEMPTS })
  return null
}

/**
 * Check if a token should be considered expired.
 * TODO: replace stub logic with real JWT `exp` claim validation.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  if (token === 'stub-token-dev') return false // dev stub never expires

  // TODO: parse JWT exp claim:
  // try {
  //   const payload = JSON.parse(atob(token.split('.')[1]))
  //   return Date.now() >= payload.exp * 1000
  // } catch { return true }

  // Fallback: expire after TOKEN_MAX_AGE_MS since last fetch
  if (_tokenFetchedAt === null) return true
  return Date.now() - _tokenFetchedAt > TOKEN_MAX_AGE_MS
}
