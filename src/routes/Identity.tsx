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
        padding: '24px 20px 20px',
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
        <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: 4 }}>
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
              color: '#fff',
              gap: 6,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <img src={cameraIcon} width={24} height={24} alt="" />
            <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, lineHeight: 1.2, textAlign: 'center' }}>
              Take<br />Picture
            </span>
          </div>
        )}
      </div>

      {/* Team motto */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-med)', color: 'rgba(255,255,255,0.88)', letterSpacing: 1, marginBottom: 2, fontStyle: 'italic' }}>
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
        <div className="page-in" style={{
          display: 'flex', flexDirection: 'column',
          height: '100%',
          padding: 'var(--sp-6) var(--sp-5) var(--sp-4)',
        }}>
          {/* Header */}
          <div style={{ flexShrink: 0, marginBottom: 'var(--sp-5)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-light)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--sp-1)',
            }}>
              Choose your team
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
              Select the country you're supporting
            </p>
          </div>

          {/* Search */}
          <div style={{ flexShrink: 0, marginBottom: 'var(--sp-3)' }}>
            <input
              type="text"
              placeholder="Search teams…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Team list — scrollable */}
          <div className="scroll-y stagger" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
            {filtered.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                className="glass-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--c-text-1)',
                  textAlign: 'left',
                  flexShrink: 0,
                  width: '100%',
                }}
              >
                {/* Colour swatch */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})`,
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {team.flag}
                </div>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-reg)', flex: 1 }}>
                  {team.name}
                </span>
                <span style={{ color: 'var(--c-text-3)', fontSize: 16 }}>›</span>
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
      <div className="page-in" style={{ padding: 'var(--sp-8) var(--sp-5)', textAlign: 'center', maxWidth: 340, width: '100%' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-light)',
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: 'var(--sp-2)',
        }}>
          Looking good!
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--sp-6)' }}>
          Your fan card is ready
        </p>

        <CardPreview teamId={selectedTeamId!} photoDataUrl={photoDataUrl} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>
          <button
            onClick={handleContinue}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Continue
          </button>
          <button
            onClick={handleRetake}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Retake Photo
          </button>
        </div>
      </div>
    </Screen>
  )
}
