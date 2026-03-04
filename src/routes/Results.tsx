import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'

export default function Results() {
  const navigate = useNavigate()

  return (
    <Screen centered>
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Results &amp; Leaderboard
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--font-size-sm)' }}>
          M4 — Score display, share scorecard &amp; leaderboard ranking.<br />
          Implementation coming in MAR-32 / MAR-33.
        </p>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            track('results_home_tapped')
            navigate('/')
          }}
        >
          Back to Home
        </Button>
      </div>
    </Screen>
  )
}
