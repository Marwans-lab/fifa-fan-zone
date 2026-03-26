import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'
import { WORLD_CUP_TEAMS } from '../data/teams'

const CARD_TEAMS = [
  WORLD_CUP_TEAMS.find(t => t.id === 'bra')!,
  WORLD_CUP_TEAMS.find(t => t.id === 'arg')!,
]

function FanCardStack() {
  const cards: { width: number; height: number; rotate: number; zIndex: number; teamIndex: number }[] = [
    { width: 272, height: 388, rotate: 5, zIndex: 1, teamIndex: 0 },
    { width: 301, height: 430, rotate: -3, zIndex: 2, teamIndex: 1 },
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
              borderRadius: 'var(--f-brand-radius-inner)',
              transform: `rotate(${card.rotate}deg)`,
              background: `linear-gradient(160deg, ${team.colors[0]}, ${team.colors[1]})`,
              boxShadow: '0 8px 32px var(--f-brand-shadow-medium)',
              zIndex: card.zIndex,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--sp-6) var(--sp-5) var(--sp-5)',
              border: '1px solid var(--f-brand-color-border-subtle)',
              position: 'relative',
            }}
          >
            {/* Dot-grid halftone texture */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-inner)', pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.28) 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
              mixBlendMode: 'overlay',
            }} />
            {/* Diagonal shimmer stripes */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-inner)', pointerEvents: 'none',
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
                fontSize: '13', letterSpacing: 2, color: 'var(--f-brand-color-background-light)',
                textTransform: 'uppercase',
              }}>
                Your Fan Card
              </div>
              <div style={{ fontSize: '10', color: 'rgba(255,255,255,0.65)', letterSpacing: 1 }}>
                Collector Edition
              </div>
            </div>

            {/* Flag emoji as avatar placeholder */}
            <div style={{
              width: card.width * 0.45,
              height: card.width * 0.45,
              borderRadius: '50%',
              background: 'var(--f-brand-color-background-dark-40a)',
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
              fontSize: '18', fontWeight: '500',
              color: 'rgba(255,255,255,0.88)', letterSpacing: 0.5, fontStyle: 'italic',
              display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
              position: 'relative', zIndex: 1,
            }}>
              <span style={{ fontStyle: 'normal', fontSize: '22' }}>{team.flag}</span>
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
    navigate(hasCard ? '/card' : '/team-selection')
  }

  return (
    <div
      className="f-page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100%',
        background: 'var(--f-brand-color-background-default)',
        padding: 'var(--sp-20) var(--f-brand-space-md) var(--f-brand-space-2xl)',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--f-base-type-family-primary)',
          fontSize: '28',
          fontWeight: '100',
          lineHeight: '36px',
          color: 'var(--f-brand-color-text-default)',
          textAlign: 'center',
          margin: 0,
          maxWidth: 361,
        }}
      >
        You Could Win Tickets to FIFA World Cup 2026
      </h1>

      {/* Fan Card Stack */}
      <div style={{ marginTop: 'var(--f-brand-space-lg)', width: '100%' }}>
        <FanCardStack />
      </div>

      {/* CTA Button */}
      <button
        onClick={handlePrimary}
        style={{
          marginTop: 'var(--f-brand-space-2xl)',
          width: '100%',
          maxWidth: 361,
          height: 'var(--sp-14)',
          borderRadius: 'var(--f-brand-radius-rounded)',
          background: 'var(--f-brand-color-primary)',
          color: 'var(--f-brand-color-background-light)',
          fontFamily: 'var(--f-base-type-family-secondary)',
          fontSize: '15',
          fontWeight: '500',
          lineHeight: '24px',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--f-brand-space-md) var(--f-brand-space-xl)',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 8px 16px var(--f-brand-shadow-medium)',
        }}
      >
        {hasCard ? 'Continue' : 'Create your fan card'}
      </button>
    </div>
  )
}
