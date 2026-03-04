/**
 * Auth layer — wraps QAApp.getAuthToken() with:
 * - in-memory token storage (never persisted to localStorage)
 * - 5-second timeout to prevent infinite loading
 * - token expiry detection (stub — TODO: replace with real JWT validation)
 * - silent re-fetch on expiry
 */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  token: string | null
  status: AuthStatus
}

const TOKEN_TIMEOUT_MS = 5000
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h fallback if no JWT exp claim

let _tokenFetchedAt: number | null = null

/** Attempt to get auth token with a hard timeout. Never throws. */
export async function fetchAuthToken(): Promise<string | null> {
  try {
    const tokenPromise = window.QAApp?.getAuthToken() ?? Promise.reject(new Error('QAApp not available'))

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), TOKEN_TIMEOUT_MS)
    )

    const token = await Promise.race([tokenPromise, timeoutPromise])
    _tokenFetchedAt = Date.now()
    return token
  } catch {
    return null
  }
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
