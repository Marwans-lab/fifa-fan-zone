import { useState, useEffect } from 'react'
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
  if (pct === 1)  return { label: 'Perfect Score', color: 'var(--c-accent)' }
  if (pct >= 0.8) return { label: 'Top Fan',        color: 'var(--c-accent)' }
  if (pct >= 0.6) return { label: 'Good Try',       color: 'var(--c-warn)' }
  if (pct >= 0.4) return { label: 'Keep Learning',  color: 'var(--c-warn)' }
  return               { label: 'Better luck next time', color: 'var(--c-warn)' }
}

// SVG ring size constants — 1.5× the original 136px
const RING_SIZE = 204
const RING_STROKE = 6
const RING_R = (RING_SIZE - RING_STROKE * 2) / 2
const RING_CX = RING_SIZE / 2
const RING_CIRC = 2 * Math.PI * RING_R

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useStore()

  const result = location.state as QuizResult | undefined
  const homeRoute = appState.fanCard.teamId ? '/card' : '/'

  // Hooks before early return
  const rawPct = result ? result.score / result.total : 0
  const [ringProgress, setRingProgress] = useState(0)
  const [displayPoints, setDisplayPoints] = useState(0)

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => setRingProgress(rawPct), 60)
    return () => clearTimeout(t)
  }, [rawPct, result])

  useEffect(() => {
    if (!result) return
    const target = appState.points
    const duration = 900
    let rafId: number
    const delay = setTimeout(() => {
      const start = performance.now()
      function step(now: number) {
        const elapsed = now - start
        const p = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplayPoints(Math.round(eased * target))
        if (p < 1) rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
    }, 60)
    return () => { clearTimeout(delay); cancelAnimationFrame(rafId) }
  }, [appState.points, result])

  if (!result) {
    return (
      <Screen centered>
        <div style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--sp-5)' }}>🏆</div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-light)', marginBottom: 'var(--sp-2)', letterSpacing: 'var(--tracking-tight)' }}>
            Your Score
          </h2>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-med)', color: 'var(--c-accent)', marginBottom: 'var(--sp-8)', letterSpacing: 'var(--tracking-tight)' }}>
            {appState.points} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', fontWeight: 'var(--weight-reg)' }}>pts</span>
          </p>
          <Button fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play a Quiz
          </Button>
          <Button variant="ghost" fullWidth style={{ marginTop: 'var(--sp-3)' }} onClick={() => navigate(homeRoute)}>
            Back to Home
          </Button>
        </div>
      </Screen>
    )
  }

  const { score, total, quizTitle } = result
  const { label, color } = statusLabel(score, total)
  const emoji = score === total ? '🏆' : score >= total * 0.6 ? '⭐' : '⚽'

  return (
    <Screen centered>
      <div style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center', maxWidth: 380, width: '100%' }}>

        {/* Emoji */}
        <div style={{ fontSize: 56, marginBottom: 'var(--sp-5)', lineHeight: 1 }}>{emoji}</div>

        {/* Status label */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-light)',
          letterSpacing: 'var(--tracking-tight)',
          color,
          marginBottom: 'var(--sp-2)',
        }}>
          {label}
        </div>

        {/* Quiz title */}
        <div style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--c-text-2)',
          marginBottom: 'var(--sp-8)',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
        }}>
          {quizTitle}
        </div>

        {/* Score ring — animated SVG progress, count-up points inside */}
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, margin: '0 auto var(--sp-8)' }}>
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle cx={RING_CX} cy={RING_CX} r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={RING_STROKE} />
            {/* Progress arc */}
            <circle
              cx={RING_CX} cy={RING_CX} r={RING_R}
              fill="none"
              stroke={color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - ringProgress)}
              style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
            />
          </svg>
          {/* Inner content */}
          <div style={{
            position: 'absolute',
            inset: RING_STROKE * 2,
            borderRadius: '50%',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            boxShadow: `0 0 40px ${color}22, var(--glass-shine)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-light)', letterSpacing: 'var(--tracking-tight)', color, lineHeight: 1 }}>
              {displayPoints}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 4 }}>
              Points
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', width: '100%' }}>
          <Button fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play Another Quiz
          </Button>
          <Button variant="secondary" fullWidth onClick={() => { track('results_leaderboard_tapped'); navigate('/leaderboard') }}>
            View Leaderboard
          </Button>
          <Button variant="ghost" fullWidth onClick={() => { track('results_home_tapped'); navigate(homeRoute) }}>
            Back to Home
          </Button>
        </div>
      </div>
    </Screen>
  )
}
