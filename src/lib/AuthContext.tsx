import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchAuthToken, isTokenExpired, type AuthState } from './auth'

interface AuthContextValue extends AuthState {
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, status: 'loading' })
  const retryCount = useRef(0)

  async function resolveAuth() {
    setState(prev => ({ ...prev, status: 'loading' }))
    const token = await fetchAuthToken()
    setState({
      token,
      status: token ? 'authenticated' : 'unauthenticated',
    })
  }

  // Periodic expiry check — every 60s
  useEffect(() => {
    resolveAuth()

    const interval = setInterval(() => {
      setState(prev => {
        if (isTokenExpired(prev.token)) {
          resolveAuth()
        }
        return prev
      })
    }, 60_000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function retry() {
    retryCount.current += 1
    resolveAuth()
  }

  return (
    <AuthContext.Provider value={{ ...state, retry }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
