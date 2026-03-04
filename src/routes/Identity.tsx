import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'

export default function Identity() {
  const navigate = useNavigate()

  return (
    <Screen centered>
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Entry &amp; Identity
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--font-size-sm)' }}>
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
          style={{ marginTop: 'var(--space-3)' }}
          onClick={() => navigate('/')}
        >
          Back
        </Button>
      </div>
    </Screen>
  )
}
