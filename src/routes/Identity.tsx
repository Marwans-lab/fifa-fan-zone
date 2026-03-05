import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'

export default function Identity() {
  const navigate = useNavigate()

  return (
    <Screen centered>
      <div style={{ padding: 'var(--sp-8)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-light)',
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: 'var(--sp-4)',
        }}>
          Entry &amp; Identity
        </h2>
        <p style={{ color: 'var(--c-text-2)', marginBottom: 'var(--sp-8)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-normal)' }}>
          M1 — Team selection, photo capture &amp; card save.<br />
          Implementation coming in MAR-27 / MAR-28.
        </p>
        <Button
          fullWidth
          onClick={() => {
            track('identity_skip_tapped')
            navigate('/card')
          }}
        >
          Continue to Card
        </Button>
        <Button
          variant="ghost"
          fullWidth
          style={{ marginTop: 'var(--sp-3)' }}
          onClick={() => navigate('/')}
        >
          Back
        </Button>
      </div>
    </Screen>
  )
}
