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
        <div className="f-page-enter" style={{ textAlign: 'center', padding: 'var(--f-brand-space-xl) var(--f-brand-space-lg)', maxWidth: 300 }}>
          <div style={{ marginBottom: 'var(--f-brand-space-md)', opacity: 0.5 }}><img src={lockIcon} width={24} height={24} alt="" /></div>
          <h2 style={{
            fontFamily: 'var(--f-base-type-family-primary)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--f-brand-space-sm)',
            color: 'var(--f-brand-color-text-default)',
          }}>
            Session unavailable
          </h2>
          <p style={{
            color: 'var(--f-brand-color-text-subtle)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-normal)',
            marginBottom: 'var(--f-brand-space-lg)',
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
