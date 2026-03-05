import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'

interface QuizResult {
  score: number
  total: number
  quizTitle: string
}

function statusLabel(score: number, total: number): { label: string; color: string } {
  const pct = score / total
  if (pct === 1)       return { label: 'Perfect Score! 🏆', color: '#00d4aa' }
  if (pct >= 0.8)      return { label: 'Top Fan ⭐',         color: '#00d4aa' }
  if (pct >= 0.6)      return { label: 'Good Try 👍',        color: '#ffb800' }
  if (pct >= 0.4)      return { label: 'Keep Learning 📖',   color: '#ffb800' }
  return               { label: 'Better luck next time',    color: '#ff4d4d' }
}

export default function Results() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { state: appState } = useStore()

  const result = location.state as QuizResult | undefined

  if (!result) {
    // Direct navigation without quiz result — show total points
    return (
      <Screen centered>
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🏆</div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
            Your Score
          </h2>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 'var(--space-6)' }}>
            {appState.points} pts
          </p>
          <Button fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play a Quiz
          </Button>
          <Button variant="ghost" fullWidth style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </Screen>
    )
  }

  const { score, total, quizTitle } = result
  const { label, color } = statusLabel(score, total)
  const pct = Math.round((score / total) * 100)

  return (
    <Screen centered>
      <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', maxWidth: 380, width: '100%' }}>

        {/* Trophy / emoji */}
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>
          {score === total ? '🏆' : score >= total * 0.6 ? '⭐' : '⚽'}
        </div>

        {/* Status */}
        <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 'var(--space-2)' }}>
          {label}
        </div>

        {/* Quiz title */}
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          {quizTitle}
        </div>

        {/* Score ring / display */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: `6px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-6)',
            background: `${color}11`,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color }}>{score}/{total}</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{pct}%</span>
        </div>

        {/* Cumulative points */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Total points earned: <strong style={{ color: 'var(--color-accent)' }}>{appState.points}</strong>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          <Button fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play Another Quiz
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => { track('results_leaderboard_tapped'); navigate('/leaderboard') }}
          >
            View Leaderboard
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => { track('results_home_tapped'); navigate('/') }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </Screen>
  )
}
