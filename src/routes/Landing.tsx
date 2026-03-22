import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'
import { WORLD_CUP_TEAMS } from '../data/teams'
import Screen from '../components/Screen'

const CARD_TEAMS = [
  WORLD_CUP_TEAMS.find(t => t.id === 'usa')!,
  WORLD_CUP_TEAMS.find(t => t.id === 'bra')!,
  WORLD_CUP_TEAMS.find(t => t.id === 'arg')!,
]

function FanCardStack() {
  const cards: { width: number; height: number; rotate: number; zIndex: number; teamIndex: number }[] = [
    { width: 280, height: 400, rotate: 3, zIndex: 1, teamIndex: 0 },
    { width: 288, height: 411, rotate: -2.3, zIndex: 2, teamIndex: 1 },
    { width: 301, height: 430, rotate: -6.6, zIndex: 3, teamIndex: 2 },
  ]

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        maxWidth: 340,
        aspectRatio: '340 / 440',
        margin: '0 auto',
      }}
    >
      {cards.map((card, i) => {
        const team = CARD_TEAMS[card.teamIndex]
        return (
          <div
            key={i}
            style={{
              gridArea: '1 / 1',
              width: card.width,
              height: card.height,
              borderRadius: 'var(--r-md)',
              transform: `rotate(${card.rotate}deg)`,
              background: `linear-gradient(160deg, ${team.colors[0]}, ${team.colors[1]})`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              zIndex: card.zIndex,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 20px 20px',
              border: '1px solid rgba(255,255,255,0.12)',
              position: 'relative',
            }}
          >
            {/* Dot-grid halftone texture */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 'var(--r-md)', pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.28) 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
              mixBlendMode: 'overlay',
            }} />
            {/* Diagonal shimmer stripes */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 'var(--r-md)', pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.10) 18px, rgba(255,255,255,0.10) 19px)',
              mixBlendMode: 'overlay',
            }} />
            {/* Holographic top stripe */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
            }} />

            {/* Card header */}
            <div style={{ textAlign: 'left', width: '100%', position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: 'var(--text-sm)', letterSpacing: 2, color: '#ffffff',
                textTransform: 'uppercase',
              }}>
                Your Fan Card
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'rgba(255,255,255,0.65)', letterSpacing: 1 }}>
                Collector Edition
              </div>
            </div>

            {/* Flag emoji as avatar placeholder */}
            <div style={{
              width: card.width * 0.45,
              height: card.width * 0.45,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.2)',
              border: '3px solid rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{ fontSize: card.width * 0.18 }}>{team.flag}</span>
            </div>

            {/* Team name */}
            <div style={{
              fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-med)',
              color: 'rgba(255,255,255,0.88)', letterSpacing: 0.5, fontStyle: 'italic',
              display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative', zIndex: 1,
            }}>
              <span style={{ fontStyle: 'normal', fontSize: 'var(--text-xl)' }}>{team.flag}</span>
              {team.name}
            </div>
          </div>
        )
      })}
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

  return (
    <Screen
      className="page-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100%',
        background: '#f2f3fa',
        padding: `86px var(--sp-4) var(--sp-10)`,
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-thin)',
          lineHeight: '36px',
          color: '#1f212b',
          textAlign: 'center',
          margin: 0,
          maxWidth: 361,
        }}
      >
        You Could Win Tickets to FIFA World Cup 2026
      </h1>

      {/* Fan Card Stack */}
      <div style={{ marginTop: 'var(--sp-6)', width: '100%' }}>
        <FanCardStack />
      </div>

      {/* CTA Button */}
      <button
        onClick={handlePrimary}
        style={{
          marginTop: 'var(--sp-10)',
          width: '100%',
          maxWidth: 361,
          height: 56,
          borderRadius: 'var(--r-full)',
          background: '#8e2157',
          color: '#ffffff',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-med)',
          lineHeight: '24px',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--sp-4) var(--sp-8)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {hasCard ? 'Continue' : 'Create your fan card'}
      </button>
    </Screen>
  )
}
