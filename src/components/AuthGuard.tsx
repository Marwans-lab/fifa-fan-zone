import type { ReactNode } from 'react'
import { useAuth } from '../lib/AuthContext'
import Spinner from './Spinner'
import Screen from './Screen'
import Button from './Button'
import lockIcon from '../assets/icons/Lock-white.svg'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { status, retry } = useAuth()

  if (status === 'loading') {
    return <Spinner fullScreen />
  }

  if (status === 'unauthenticated') {
    return (
      <Screen centered>
        <div className="page-in" style={{ textAlign: 'center', padding: 'var(--sp-8) var(--sp-6)', maxWidth: 300 }}>
          <div style={{ marginBottom: 'var(--sp-5)', opacity: 0.5 }}><img src={lockIcon} width={24} height={24} alt="" /></div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--sp-3)',
            color: 'var(--c-lt-text-1)',
          }}>
            Session unavailable
          </h2>
          <p style={{
            color: 'var(--c-lt-text-2)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-normal)',
            marginBottom: 'var(--sp-6)',
          }}>
            We couldn't establish a session. Please try again or re-open FanZone from the Qatar Airways app.
          </p>
          <Button fullWidth onClick={retry}>
            Retry
          </Button>
        </div>
      </Screen>
    )
  }

  return <>{children}</>
}
