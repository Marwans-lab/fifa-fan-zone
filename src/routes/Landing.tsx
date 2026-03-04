import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'

export default function Landing() {
  const navigate = useNavigate()
  const { state } = useStore()
  const hasCard = !!state.fanCard.teamId

  function handleCTA() {
    track('landing_cta_tapped', { hasCard })
    navigate(hasCard ? '/card' : '/identity')
  }

  return (
    <Screen centered>
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>⚽</div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            lineHeight: 'var(--line-height-tight)',
            marginBottom: 'var(--space-4)',
          }}
        >
          FIFA FanZone
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-8)',
          }}
        >
          Support your team. Complete missions. Climb the leaderboard. Top 5 fans win Avios.
        </p>

        <Button fullWidth onClick={handleCTA}>
          {hasCard ? 'Continue' : 'Create your fan card'}
        </Button>

        {hasCard && (
          <Button
            variant="ghost"
            fullWidth
            style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}
            onClick={() => navigate('/quiz')}
          >
            Go to Quiz
          </Button>
        )}
      </div>
    </Screen>
  )
}
