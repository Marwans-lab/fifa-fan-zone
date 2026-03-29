import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import trophyIcon from '../assets/icons/Trophy-white.svg'
import tickWhite  from '../assets/icons/Tick-white.svg'
import targetIcon from '../assets/icons/Target-white.svg'

interface QuizResult {
  score: number
  total: number
  quizTitle: string
}

function statusLabel(score: number, total: number): { label: string; color: string } {
  const pct = score / total
  if (pct === 1)  return { label: 'Perfect score', color: 'var(--f-brand-color-accent)' }
  if (pct >= 0.8) return { label: 'Top fan',        color: 'var(--f-brand-color-accent)' }
  if (pct >= 0.6) return { label: 'Good try',       color: 'var(--f-brand-color-status-warning)' }
  if (pct >= 0.4) return { label: 'Keep learning',  color: 'var(--f-brand-color-status-warning)' }
  return               { label: 'Better luck next time', color: 'var(--f-brand-color-status-warning)' }
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
        <div data-page="results" className="f-page-enter results-page" style={{ padding: 'var(--f-brand-space-2xl) var(--f-brand-space-lg)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div className="results-trophy" style={{ marginBottom: 'var(--f-brand-space-md)' }}><img className="results-icon" src={trophyIcon} width={24} height={24} alt="" /></div>
          <h2 className="results-score-label" data-section="score-label" style={{ font: 'var(--f-brand-type-title-3)', marginBottom: 'var(--f-brand-space-xs)', letterSpacing: 'var(--tracking-tight)' }}>
            <span className="results-score-label-text">Your score</span>
          </h2>
          <p className="results-score-value" data-section="score-ring" style={{ font: 'var(--f-brand-type-title-1)', color: 'var(--f-brand-color-accent)', marginBottom: 'var(--f-brand-space-xl)', letterSpacing: 'var(--tracking-tight)', fontWeight: 'var(--weight-med)' }}>
            <span className="results-score-number">{appState.points}</span>{' '}
            <span className="results-score-unit" style={{ font: 'var(--f-brand-type-caption)', color: 'var(--f-brand-color-text-subtle)' }}>pts</span>
          </p>
          <Button className="results-play-quiz-btn" fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play a quiz
          </Button>
          <Button className="results-return-home-btn" variant="ghost" fullWidth style={{ marginTop: 'var(--f-brand-space-sm)' }} onClick={() => navigate(homeRoute)}>
            Return home
          </Button>
        </div>
      </Screen>
    )
  }

  const { score, total, quizTitle } = result
  const { label, color } = statusLabel(score, total)
  const resultIcon = score === total ? trophyIcon : score >= total * 0.6 ? tickWhite : targetIcon

  return (
    <Screen centered>
      <div data-page="results" className="f-page-enter results-page" style={{ padding: 'var(--f-brand-space-2xl) var(--f-brand-space-lg)', textAlign: 'center', maxWidth: 380, width: '100%' }}>

        {/* Status label */}
        <div className="results-status" data-section="score-label" style={{
          font: 'var(--f-brand-type-title-3)',
          letterSpacing: 'var(--tracking-tight)',
          color,
          marginBottom: 'var(--f-brand-space-xs)',
        }}>
          <span className="results-status-text">{label}</span>
        </div>

        {/* Quiz title */}
        <div className="results-quiz-title" style={{
          font: 'var(--f-brand-type-caption)',
          color: 'var(--f-brand-color-text-subtle)',
          marginBottom: 'var(--f-brand-space-xl)',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
          fontSize: 'var(--text-sm)',
        }}>
          <span className="results-quiz-title-text">{quizTitle}</span>
        </div>

        {/* Score ring — animated SVG progress, count-up points inside */}
        <div className="results-ring" data-section="score-ring" style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, margin: '0 auto var(--f-brand-space-xl)' }}>
          <svg className="results-ring-svg"
            width={RING_SIZE}
            height={RING_SIZE}
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle className="results-ring-track" cx={RING_CX} cy={RING_CX} r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={RING_STROKE} />
            {/* Progress arc */}
            <circle
              className="results-ring-arc"
              cx={RING_CX} cy={RING_CX} r={RING_R}
              fill="none"
              stroke={color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - ringProgress)}
              style={{ transition: 'stroke-dashoffset var(--f-brand-motion-duration-gentle) var(--f-brand-motion-easing-standard)', filter: `drop-shadow(0 0 8px ${color}88)` }}
            />
          </svg>
          {/* Inner content */}
          <div className="results-ring-inner" style={{
            position: 'absolute',
            inset: RING_STROKE * 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.14)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span className="results-ring-points" style={{ font: 'var(--f-brand-type-title-1)', letterSpacing: 'var(--tracking-tight)', color, lineHeight: 'var(--leading-none)' }}>
              <span className="results-ring-points-text">{displayPoints}</span>
            </span>
            <span className="results-ring-label" style={{ font: 'var(--f-brand-type-caption)', color: 'var(--f-brand-color-text-subtle)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 'var(--sp-1)', fontSize: 'var(--text-xs)' }}>
              <span className="results-ring-label-text">Points</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions" data-section="actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-sm)', width: '100%' }}>
          <Button className="results-leaderboard-btn" data-ui="view-leaderboard-btn" fullWidth onClick={() => { track('results_leaderboard_tapped'); navigate('/leaderboard') }}>
            View leaderboard
          </Button>
          <Button className="results-home-btn" data-ui="return-home-btn" variant="secondary" fullWidth onClick={() => { track('results_home_tapped'); navigate(homeRoute) }}>
            Return home
          </Button>
          <Button className="results-play-again-btn" data-ui="play-again-btn" variant="ghost" fullWidth onClick={() => { track('results_play_again'); navigate('/quiz') }}>
            Play another quiz
          </Button>
        </div>
      </div>
    </Screen>
  )
}
