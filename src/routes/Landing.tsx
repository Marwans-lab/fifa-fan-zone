import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'

// Stacked animated fan card hero — pure CSS, no JS animation loop
function HeroCards() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: 220, height: 280, margin: '0 auto' }}>
      <style>{`
        @keyframes float-base {
          0%, 100% { transform: rotate(-6deg) translateY(0px); }
          50% { transform: rotate(-6deg) translateY(-8px); }
        }
        @keyframes float-mid {
          0%, 100% { transform: rotate(2deg) translateY(0px); }
          50% { transform: rotate(2deg) translateY(-12px); }
        }
        @keyframes float-top {
          0%, 100% { transform: rotate(-1deg) translateY(0px); }
          50% { transform: rotate(-1deg) translateY(-10px); }
        }
      `}</style>

      {/* Card 3 — back */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #0d4030 100%)',
        border: '1px solid #2a5a40',
        willChange: 'transform',
        animation: 'float-base 4s ease-in-out infinite',
        animationDelay: '0.4s',
      }} />

      {/* Card 2 — middle */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #1a2a3a 0%, #0d2040 100%)',
        border: '1px solid #2a4060',
        willChange: 'transform',
        animation: 'float-mid 4s ease-in-out infinite',
        animationDelay: '0.2s',
      }} />

      {/* Card 1 — front */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #141414 0%, #1e1e1e 100%)',
        border: '1px solid var(--color-accent)',
        willChange: 'transform',
        animation: 'float-top 4s ease-in-out infinite',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-6)',
      }}>
        {/* Card avatar placeholder */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}>
          ⚽
        </div>
        {/* Card name bar */}
        <div style={{
          height: 12,
          width: '70%',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-border)',
        }} />
        {/* Card team bar */}
        <div style={{
          height: 8,
          width: '45%',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-border)',
          opacity: 0.6,
        }} />
        {/* Accent stripe */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          background: 'var(--color-accent)',
        }} />
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { state } = useStore()
  const hasCard = !!state.fanCard.teamId
  const authFetched = useRef(false)

  useEffect(() => {
    track('landing_viewed', { hasCard })

    // Fire-and-forget auth token fetch for downstream use
    if (!authFetched.current) {
      authFetched.current = true
      window.QAApp?.getAuthToken().catch(() => {
        // Non-fatal — auth will be re-attempted at identity flow
      })
    }
  }, [hasCard])

  function handlePrimary() {
    track('landing_primary_cta_tapped', { hasCard })
    navigate(hasCard ? '/card' : '/identity')
  }

  function handleQuiz() {
    track('landing_quiz_cta_tapped')
    navigate('/quiz')
  }

  return (
    <Screen>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        padding: 'var(--space-6)',
      }}>

        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-4)',
        }}>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
          }}>
            FIFA FanZone
          </span>
          {state.points > 0 && (
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
            }}>
              {state.points} pts
            </span>
          )}
        </header>

        {/* Hero */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-8)',
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-8)',
        }}>
          <HeroCards />

          <div style={{ textAlign: 'center', maxWidth: 300 }}>
            <h1 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              lineHeight: 'var(--line-height-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              {hasCard ? 'Welcome back,\nFan' : 'Show your\nteam spirit'}
            </h1>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: 'var(--line-height-normal)',
            }}>
              {hasCard
                ? 'Keep playing, climb the leaderboard and win Avios.'
                : 'Create your fan card, complete missions, and compete to win Avios.'}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
          <Button fullWidth onClick={handlePrimary}>
            {hasCard ? 'Continue' : 'Create your fan card'}
          </Button>

          {hasCard && (
            <Button variant="secondary" fullWidth onClick={handleQuiz}>
              Play Quiz
            </Button>
          )}

          {/* Avios badge */}
          <p style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-2)',
          }}>
            Top 5 fans win Avios ✈️
          </p>
        </div>
      </div>
    </Screen>
  )
}
