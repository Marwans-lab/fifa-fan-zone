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
        <div className="auth-guard-error-card f-page-enter" style={{ textAlign: 'center', padding: 'var(--f-brand-space-xl) var(--f-brand-space-lg)', maxWidth: 300 }}>
          <div className="auth-guard-error-icon-wrapper" style={{ marginBottom: 'var(--f-brand-space-md)', opacity: 0.5 }}><img className="auth-guard-error-icon" src={lockIcon} width={24} height={24} alt="" /></div>
          <h2 className="auth-guard-error-title" style={{
            fontFamily: 'var(--f-base-type-family-primary)',
            fontSize: '22',
            fontWeight: '300',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--f-brand-space-sm)',
            color: 'var(--f-brand-color-text-default)',
          }}>
            Session unavailable
          </h2>
          <p className="auth-guard-error-body" style={{
            color: 'var(--f-brand-color-text-subtle)',
            fontSize: '13',
            lineHeight: '1.52',
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
