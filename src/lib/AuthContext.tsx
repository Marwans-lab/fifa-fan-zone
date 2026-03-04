import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { fetchAuthToken, isTokenExpired, type AuthState } from './auth'

const SLOW_THRESHOLD_MS = 2_000 // show descriptive message after 2s

interface AuthContextValue extends AuthState {
  isSlow: boolean
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState]   = useState<AuthState>({ token: null, status: 'loading' })
  const [isSlow, setIsSlow] = useState(false)
  const slowTimer           = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolveAuth = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading' }))
    setIsSlow(false)

    // Show slow message if loading takes > SLOW_THRESHOLD_MS
    slowTimer.current = setTimeout(() => setIsSlow(true), SLOW_THRESHOLD_MS)

    const token = await fetchAuthToken()

    clearTimeout(slowTimer.current)
    setIsSlow(false)
    setState({ token, status: token ? 'authenticated' : 'unauthenticated' })
  }, [])

  // Initial auth on mount + 60s expiry poll
  useEffect(() => {
    resolveAuth()

    const interval = setInterval(() => {
      setState(prev => {
        if (isTokenExpired(prev.token)) resolveAuth()
        return prev
      })
    }, 60_000)

    return () => clearInterval(interval)
  }, [resolveAuth])

  // Re-auth when app returns to foreground (iOS WebView lifecycle)
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setState(prev => {
          if (isTokenExpired(prev.token)) resolveAuth()
          return prev
        })
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [resolveAuth])

  const retry = useCallback(() => { resolveAuth() }, [resolveAuth])

  return (
    <AuthContext.Provider value={{ ...state, isSlow, retry }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
