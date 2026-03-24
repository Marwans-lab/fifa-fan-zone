import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'

interface QuizResult {
  score: number
  total: number
  quizTitle: string
}

function statusLabel(score: number, total: number): { label: string; iconType: 'trophy' | 'tick' | 'target' } {
  const pct = score / total
  if (pct === 1)  return { label: 'Perfect Score', iconType: 'trophy' }
  if (pct >= 0.6) return { label: 'Good Try',       iconType: 'tick' }
  return               { label: 'Keep Going',      iconType: 'target' }
}

// Status icon SVGs using FDS icon tokens
function StatusIcon({ type }: { type: 'trophy' | 'tick' | 'target' }) {
  const color = type === 'trophy' || type === 'tick'
    ? 'var(--f-brand-color-icon-success)'
    : 'var(--f-brand-color-icon-primary)'

  if (type === 'trophy') {
    return (
      <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <path d="M8 21h8m-4-4v4m-4.5-8.25c-2.032-.895-3.5-2.67-3.5-4.75h2m12 0h2c0 2.08-1.468 3.855-3.5 4.75M7 4h10v7a5 5 0 01-10 0V4z"
          stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'tick') {
    return (
      <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
        <path d="M8 12l3 3 5-5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.5} />
      <circle cx={12} cy={12} r={1} fill={color} />
    </svg>
  )
}

// SVG ring constants
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

  // No-result fallback
  if (!result) {
    return (
      <div
        style={{
          background: 'var(--f-brand-color-background-default)',
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="page-in" style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <StatusIcon type="trophy" />
          </div>
          <h2
            style={{
              fontFamily: 'var(--f-brand-type-title-4-family)',
              fontSize: 'var(--f-brand-type-title-4-size)',
              fontWeight: 'var(--f-brand-type-title-4-weight)',
              lineHeight: 'var(--f-brand-type-title-4-line)',
              color: 'var(--f-brand-color-text-heading)',
              marginBottom: 'var(--sp-2)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            Your Score
          </h2>
          <p
            style={{
              fontFamily: 'var(--f-brand-type-title-1-family)',
              fontSize: 'var(--f-brand-type-title-1-size)',
              fontWeight: 'var(--f-brand-type-headline-medium-weight)',
              color: 'var(--f-brand-color-text-primary)',
              marginBottom: 'var(--sp-8)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            {appState.points} <span style={{ fontSize: 'var(--f-brand-type-body-medium-size)', color: 'var(--f-brand-color-text-secondary)', fontWeight: 'var(--weight-reg)' }}>pts</span>
          </p>
          <button
            onClick={() => { track('results_play_again'); navigate('/quiz') }}
            className="f-button f-button--primary"
          >
            Play a Quiz
          </button>
          <button
            onClick={() => navigate(homeRoute)}
            className="f-button f-button--ghost"
            style={{ marginTop: 'var(--sp-3)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const { score, total, quizTitle } = result
  const { label, iconType } = statusLabel(score, total)
  const ringColor = iconType === 'trophy' || iconType === 'tick'
    ? 'var(--f-brand-color-icon-success)'
    : 'var(--f-brand-color-icon-primary)'

  return (
    <div
      style={{
        background: 'var(--f-brand-color-background-default)',
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="page-in" style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center', maxWidth: 380, width: '100%' }}>

        {/* Status icon */}
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <StatusIcon type={iconType} />
        </div>

        {/* Status label */}
        <div
          style={{
            fontFamily: 'var(--f-brand-type-title-4-family)',
            fontSize: 'var(--f-brand-type-title-4-size)',
            fontWeight: 'var(--f-brand-type-title-4-weight)',
            lineHeight: 'var(--f-brand-type-title-4-line)',
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--f-brand-color-text-heading)',
            marginBottom: 'var(--sp-2)',
          }}
        >
          {label}
        </div>

        {/* Quiz title */}
        <div
          style={{
            fontFamily: 'var(--f-brand-type-body-medium-family)',
            fontSize: 'var(--f-brand-type-body-medium-size)',
            color: 'var(--f-brand-color-text-secondary)',
            marginBottom: 'var(--sp-8)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}
        >
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
            <circle
              cx={RING_CX} cy={RING_CX} r={RING_R}
              fill="none"
              stroke="var(--f-brand-color-background-disabled)"
              strokeWidth={RING_STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={RING_CX} cy={RING_CX} r={RING_R}
              fill="none"
              stroke="var(--f-brand-color-background-primary)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - ringProgress)}
              style={{
                transition: `stroke-dashoffset var(--f-brand-motion-duration-gentle) var(--f-brand-motion-easing-gentle)`,
              }}
            />
          </svg>
          {/* Inner content */}
          <div
            style={{
              position: 'absolute',
              inset: RING_STROKE * 2,
              borderRadius: '50%',
              background: 'var(--f-brand-color-background-surface)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--f-brand-type-title-1-family)',
                fontSize: 'var(--f-brand-type-title-1-size)',
                fontWeight: 'var(--f-brand-type-title-1-weight)',
                lineHeight: 'var(--f-brand-type-title-1-line)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--f-brand-color-text-heading)',
              }}
            >
              {displayPoints}
            </span>
            <span
              style={{
                fontFamily: 'var(--f-brand-type-body-medium-family)',
                fontSize: 'var(--text-2sm)',
                color: 'var(--f-brand-color-text-secondary)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                marginTop: 'var(--sp-1)',
              }}
            >
              Points
            </span>
          </div>
        </div>

        {/* Points earned */}
        <div
          style={{
            fontFamily: 'var(--f-brand-type-headline-medium-family)',
            fontSize: 'var(--f-brand-type-headline-medium-size)',
            fontWeight: 'var(--f-brand-type-headline-medium-weight)',
            lineHeight: 'var(--f-brand-type-headline-medium-line)',
            color: 'var(--f-brand-color-text-primary)',
            marginBottom: 'var(--sp-8)',
          }}
        >
          +{score} {score === 1 ? 'point' : 'points'} earned
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', width: '100%' }}>
          <button
            onClick={() => { track('results_play_again'); navigate('/quiz') }}
            className="f-button f-button--secondary"
          >
            Play Again
          </button>
          <button
            onClick={() => { track('results_home_tapped'); navigate(homeRoute) }}
            className="f-button f-button--primary"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  )
}
