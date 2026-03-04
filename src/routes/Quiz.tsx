import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'

export default function Quiz() {
  const navigate = useNavigate()

  return (
    <Screen centered>
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Quiz Engine
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--font-size-sm)' }}>
          M3 — Quiz selection, questions, timer &amp; scoring.<br />
          Implementation coming in MAR-31.
        </p>
        <Button
          fullWidth
          onClick={() => {
            track('quiz_to_results_tapped')
            navigate('/results')
          }}
        >
          See Results
        </Button>
        <Button
          variant="ghost"
          fullWidth
          style={{ marginTop: 'var(--space-3)' }}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
    </Screen>
  )
}
