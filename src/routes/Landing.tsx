import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'
import stadiumIcon from '../assets/icons/stadium-white.svg'

function HeroCards() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: 220, height: 280, margin: '0 auto' }}>
      <style>{`
        @keyframes float-a { 0%,100%{transform:rotate(-5deg) translateY(0)} 50%{transform:rotate(-5deg) translateY(-8px)} }
        @keyframes float-b { 0%,100%{transform:rotate(3deg) translateY(0)} 50%{transform:rotate(3deg) translateY(-12px)} }
        @keyframes float-c { 0%,100%{transform:rotate(-1deg) translateY(0)} 50%{transform:rotate(-1deg) translateY(-10px)} }
      `}</style>

      {[
        { style: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', animation: 'float-a 5s ease-in-out infinite', animationDelay: '0.6s' } },
        { style: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', animation: 'float-b 5s ease-in-out infinite', animationDelay: '0.3s' } },
        { style: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,170,0.25)', animation: 'float-c 5s ease-in-out infinite', animationDelay: '0s' } },
      ].map((card, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: 0,
            borderRadius: 'var(--r-xl)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            willChange: 'transform',
            ...card.style,
          }}
        />
      ))}

      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 'var(--r-xl)',
        border: '1px solid rgba(0,212,170,0.25)',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'float-c 5s ease-in-out infinite',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'var(--sp-3)', padding: 'var(--sp-6)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--r-full)',
          background: 'rgba(0,212,170,0.08)',
          border: '1px solid rgba(0,212,170,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={stadiumIcon} width={24} height={24} alt="" style={{ opacity: 0.7 }} />
        </div>
        <div style={{ height: 10, width: '65%', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ height: 7, width: '40%', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 var(--r-xl) var(--r-xl)', background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.4), transparent)' }} />
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
    if (!authFetched.current) {
      authFetched.current = true
      window.QAApp?.getAuthToken().catch(() => {})
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
      <div className="page-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 'var(--sp-6)' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--c-border)' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-wider)',
            color: 'var(--c-accent)',
            textTransform: 'uppercase',
          }}>
            FIFA FanZone
          </span>
          {state.points > 0 && (
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-2)',
              background: 'var(--glass-bg)',
              padding: 'var(--sp-1) var(--sp-3)',
              borderRadius: 'var(--r-full)',
              border: '1px solid var(--c-border)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {state.points} pts
            </span>
          )}
        </header>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 'var(--sp-10)', paddingTop: 'var(--sp-8)', paddingBottom: 'var(--sp-8)',
        }}>
          <HeroCards />

          <div style={{ textAlign: 'center', maxWidth: 280 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--weight-light)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              color: 'var(--c-text-1)',
              marginBottom: 'var(--sp-4)',
            }}>
              {hasCard ? 'Welcome back' : 'Show your\nteam spirit'}
            </h1>
            <p style={{
              color: 'var(--c-text-2)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-normal)',
              fontWeight: 'var(--weight-reg)',
            }}>
              {hasCard
                ? 'Keep playing, climb the leaderboard and win Avios.'
                : 'Create your fan card, complete missions, and compete to win Avios.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', paddingBottom: 'var(--sp-6)' }}>
          <Button fullWidth onClick={handlePrimary}>
            {hasCard ? 'Continue' : 'Create your fan card'}
          </Button>

          {hasCard && (
            <Button variant="secondary" fullWidth onClick={handleQuiz}>
              Play Quiz
            </Button>
          )}

          <p style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-3)',
            marginTop: 'var(--sp-2)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            Top 5 fans win Avios
          </p>
        </div>
      </div>
    </Screen>
  )
}
