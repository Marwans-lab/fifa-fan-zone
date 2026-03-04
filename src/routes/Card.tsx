import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'

export default function Card() {
  const navigate = useNavigate()
  const { state, updateFanCard } = useStore()

  function handleSave(answers: Record<string, string>) {
    updateFanCard({
      answers,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <Screen centered>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          padding: 'var(--space-6) var(--space-4)',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Your Fan Card
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Tap to flip &amp; complete your profile
          </p>
        </div>

        <FanCard fanCard={state.fanCard} onSave={handleSave} />

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <Button
            fullWidth
            onClick={() => {
              track('card_to_quiz_tapped')
              navigate('/quiz')
            }}
          >
            Start Quiz
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              track('card_back_tapped')
              navigate(-1)
            }}
          >
            Back
          </Button>
        </div>
      </div>
    </Screen>
  )
}
