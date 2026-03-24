import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
      style={{
        width: '100%',
        aspectRatio: '300 / 420',
        borderRadius: 'var(--r-xl)',
        background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`,
        border: '1px solid rgba(255,255,255,0.12)',
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
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
      }} />

      {/* Header text */}
      <div style={{ textAlign: 'center', width: '100%', zIndex: 1 }}>
        <div style={{
          fontSize: 10,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.65)',
          textTransform: 'uppercase',
          marginBottom: 'var(--sp-1)',
        }}>
          FIFA Fan Zone
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          Collector Edition
        </div>
      </div>

      {/* Photo or placeholder */}
      <div style={{ zIndex: 1 }}>
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="Your photo"
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              border: '3px solid rgba(255,255,255,0.55)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          />
        ) : (
          <div
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.28)',
              border: '2px dashed rgba(255,255,255,0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--c-lt-surface)',
              gap: 6,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <img src={cameraIcon} width={24} height={24} alt="" />
            <span style={{
              fontSize: 9,
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: 0.8,
              lineHeight: 1.2,
              textAlign: 'center',
            }}>
              Take<br />Picture
            </span>
          </div>
        )}
      </div>

      {/* Team motto */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-med)',
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: 1,
          marginBottom: 2,
          fontStyle: 'italic',
        }}>
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
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--c-lt-bg)',
          padding: 'var(--sp-6) var(--sp-5) var(--sp-4)',
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, marginBottom: 'var(--sp-5)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            lineHeight: '32px',
            fontWeight: 'var(--weight-thin)',
            color: 'var(--c-lt-text-1)',
            marginBottom: 'var(--sp-1)',
          }}>
            Choose your team
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            lineHeight: 1.5,
            fontWeight: 'var(--weight-reg)',
            color: 'var(--c-lt-text-3)',
          }}>
            Select the country you're supporting
          </p>
        </div>

        {/* Search input — FDS input pattern */}
        <div style={{ flexShrink: 0, marginBottom: 'var(--sp-3)' }}>
          <input
            type="text"
            placeholder="Search teams…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field-light"
          />
        </div>

        {/* Team list — scrollable */}
        <div
          className="scroll-y"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
            paddingBottom: 'var(--sp-4)',
          }}
        >
          {filtered.map(team => (
            <button
              key={team.id}
              onClick={() => handleTeamSelect(team.id)}
              className="surface-row-light"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-4)',
                minHeight: 44,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 'var(--weight-med)',
                color: 'var(--c-lt-text-1)',
                textAlign: 'left',
                flexShrink: 0,
                width: '100%',
              }}
            >
              {/* Team flag */}
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                {team.flag}
              </span>

              {/* Team name — body-medium */}
              <span style={{ flex: 1 }}>
                {team.name}
              </span>

              {/* Chevron */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M9 5l7 7-7 7"
                  stroke="var(--c-lt-text-2)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Step: preview (returned from Picture route) ──────────────────────────
  return (
    <div
      className="page-in"
      style={{
        height: '100%',
        background: 'var(--c-lt-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-8) var(--sp-5)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 340, width: '100%' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          lineHeight: '32px',
          fontWeight: 'var(--weight-thin)',
          color: 'var(--c-lt-text-1)',
          marginBottom: 'var(--sp-2)',
        }}>
          Looking good!
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          lineHeight: 1.5,
          fontWeight: 'var(--weight-reg)',
          color: 'var(--c-lt-text-3)',
          marginBottom: 'var(--sp-6)',
        }}>
          Your fan card is ready
        </p>

        <CardPreview teamId={selectedTeamId!} photoDataUrl={photoDataUrl} />

        {/* Buttons — FDS primary + secondary */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-3)',
          marginTop: 'var(--sp-6)',
        }}>
          {/* Primary button */}
          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              minHeight: 48,
              padding: 'var(--sp-3) var(--sp-6)',
              borderRadius: 'var(--r-full)',
              background: 'var(--c-lt-brand)',
              color: 'var(--c-lt-surface)',
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 'var(--weight-med)',
              letterSpacing: 'var(--tracking-wide)',
              border: 'none',
              cursor: 'pointer',
              transition: `background var(--dur-base) var(--ease-out)`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Continue
          </button>

          {/* Secondary button */}
          <button
            onClick={handleRetake}
            style={{
              width: '100%',
              minHeight: 48,
              padding: 'var(--sp-3) var(--sp-6)',
              borderRadius: 'var(--r-full)',
              background: 'transparent',
              color: 'var(--c-lt-brand)',
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 'var(--weight-med)',
              letterSpacing: 'var(--tracking-wide)',
              border: '1px solid var(--c-lt-brand)',
              cursor: 'pointer',
              transition: `background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Retake photo
          </button>
        </div>
      </div>
    </div>
  )
}
