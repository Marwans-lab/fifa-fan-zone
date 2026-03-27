import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS, getTeam } from '../data/teams'
import cameraIcon from '../assets/icons/camera-white.svg'

type Step = 'team' | 'preview'

// ─── Card preview component ────────────────────────────────────────────────────
function CardPreview({
  teamId,
  photoDataUrl,
}: {
  teamId: string
  photoDataUrl: string | null
}) {
  const team = getTeam(teamId)!
  const [c1, c2] = team.colors

  return (
    <div
      className="identity-preview-card"
      style={{
        width: '100%',
        aspectRatio: '300 / 420',
        borderRadius: 'var(--f-brand-radius-outer)',
        background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`,
        border: '1px solid var(--f-brand-color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--sp-6) var(--sp-5) var(--sp-5)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 16px 48px ${c1}55, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Top holographic stripe */}
      <div className="identity-preview-stripe" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
      }} />

      {/* Header text */}
      <div className="identity-preview-header" style={{ textAlign: 'center', width: '100%', zIndex: 1 }}>
        <div className="identity-preview-title" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-display-wide)', color: 'var(--c-text-mid)', textTransform: 'uppercase', marginBottom: 'var(--sp-1)' }}>
          FIFA Fan Zone
        </div>
        <div className="identity-preview-subtitle" style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-dim)', letterSpacing: 'var(--tracking-spaced)' }}>
          Collector edition
        </div>
      </div>

      {/* Photo or placeholder */}
      <div className="identity-preview-photo-wrap" style={{ zIndex: 1 }}>
        {photoDataUrl ? (
          <img
            className="identity-preview-photo"
            src={photoDataUrl}
            alt="Your photo"
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              border: '3px solid rgba(255,255,255,0.55)',
              boxShadow: 'var(--f-brand-shadow-large)',
            }}
          />
        ) : (
          <div
            className="identity-preview-photo-placeholder"
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.28)',
              border: 'var(--c-photo-placeholder-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--f-brand-color-text-light)',
              gap: 'var(--sp-2)',
              backdropFilter: 'blur(var(--f-brand-blur-subtle))',
              WebkitBackdropFilter: 'blur(var(--f-brand-blur-subtle))',
            }}
          >
            <img className="identity-preview-camera-icon" src={cameraIcon} width={24} height={24} alt="" />
            <span className="identity-preview-camera-label" style={{ fontSize: 'var(--text-3xs)', letterSpacing: 'var(--tracking-display)', textTransform: 'uppercase', opacity: 0.8, lineHeight: 'var(--leading-close)', textAlign: 'center' }}>
              Take<br />picture
            </span>
          </div>
        )}
      </div>

      {/* Team motto */}
      <div className="identity-preview-motto-wrap" style={{ textAlign: 'center', zIndex: 1 }}>
        <div className="identity-preview-motto" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-med)', color: 'var(--c-text-hi)', letterSpacing: 'var(--tracking-spaced)', fontStyle: 'italic' }}>
          {team.motto}
        </div>
      </div>
    </div>
  )
}

// ─── Main Identity route ───────────────────────────────────────────────────────
export default function Identity() {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateFanCard } = useStore()

  // Receive photo data back from Picture route
  const incomingState = location.state as { teamId?: string; photoDataUrl?: string } | null
  const returnedTeamId = incomingState?.teamId ?? null
  const returnedPhoto = incomingState?.photoDataUrl ?? null

  const [step, setStep] = useState<Step>(returnedTeamId ? 'preview' : 'team')
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(returnedTeamId)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(returnedPhoto)

  const filtered = WORLD_CUP_TEAMS.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  function handleTeamSelect(id: string) {
    setSelectedTeamId(id)
    track('identity_team_selected', { teamId: id })
    navigate('/picture', { state: { teamId: id } })
  }

  function handleContinue() {
    if (!selectedTeamId) return
    updateFanCard({ teamId: selectedTeamId, photoDataUrl })
    track('identity_continue_tapped', { teamId: selectedTeamId })
    navigate('/card')
  }

  function handleRetake() {
    if (!selectedTeamId) return
    setPhotoDataUrl(null)
    track('identity_retake_tapped')
    navigate('/picture', { state: { teamId: selectedTeamId } })
  }

  // ── Step: team selection ───────────────────────────────────────────────────
  if (step === 'team') {
    return (
      <Screen>
        <div data-page="identity" className="f-page-enter" style={{
          display: 'flex', flexDirection: 'column',
          height: '100%',
          padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) var(--f-brand-space-md)',
        }}>
          {/* Header */}
          <div data-section="header" className="identity-header" style={{ flexShrink: 0, marginBottom: 'var(--f-brand-space-md)' }}>
            <h2 className="identity-heading" style={{
              font: 'var(--f-brand-type-title-3)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--f-brand-space-2xs)',
            }}>
              Choose your team
            </h2>
            <p className="identity-subheading" style={{ fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-subtle)' }}>
              Select the country you're supporting
            </p>
          </div>

          {/* Search */}
          <div data-section="search" className="identity-search" style={{ flexShrink: 0, marginBottom: 'var(--f-brand-space-sm)' }}>
            <input
              data-ui="team-search-input"
              type="text"
              placeholder="Search teams…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="f-input identity-search-input"
            />
          </div>

          {/* Team list — scrollable */}
          <div data-section="team-grid" className="scroll-y stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-xs)', paddingBottom: 'var(--f-brand-space-md)' }}>
            {filtered.map(team => (
              <button
                key={team.id}
                data-ui="team-option-btn"
                onClick={() => handleTeamSelect(team.id)}
                className="f-surface"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--f-brand-space-sm)',
                  padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--f-brand-color-text-default)',
                  textAlign: 'left',
                  flexShrink: 0,
                  width: '100%',
                }}
              >
                {/* Colour swatch */}
                <div className="identity-team-swatch" style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})`,
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-base)',
                }}>
                  {team.flag}
                </div>
                <span className="identity-team-name" style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-reg)', flex: 1 }}>
                  {team.name}
                </span>
                <span className="identity-team-chevron" style={{ color: 'var(--f-brand-color-text-muted)', fontSize: 'var(--text-base)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </Screen>
    )
  }

  // ── Step: preview (returned from Picture route) ──────────────────────────
  return (
    <Screen centered>
      <div data-page="identity" className="f-page-enter" style={{ padding: 'var(--f-brand-space-xl) var(--f-brand-space-md)', textAlign: 'center', maxWidth: 340, width: '100%' }}>
        <h2 className="identity-preview-heading" style={{
          font: 'var(--f-brand-type-title-3)',
          fontSize: 'var(--text-xl)',
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: 'var(--f-brand-space-xs)',
        }}>
          Looking good!
        </h2>
        <p className="identity-preview-subheading" style={{ fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-subtle)', marginBottom: 'var(--f-brand-space-lg)' }}>
          Your fan card is ready
        </p>

        <div className="identity-card-preview" data-section="card-preview">
          <CardPreview teamId={selectedTeamId!} photoDataUrl={photoDataUrl} />
        </div>

        <div className="identity-preview-actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-sm)', marginTop: 'var(--f-brand-space-lg)' }}>
          <button
            data-ui="save-fan-card-btn"
            onClick={handleContinue}
            className="f-button"
            style={{ width: '100%' }}
          >
            Save fan card
          </button>
          <button
            data-ui="retake-photo-btn"
            onClick={handleRetake}
            className="f-button f-button--secondary"
            style={{ width: '100%' }}
          >
            Retake photo
          </button>
        </div>
      </div>
    </Screen>
  )
}
