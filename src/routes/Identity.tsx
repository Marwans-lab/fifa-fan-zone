import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import { TEAMS, type Team } from '../data/teams'
import { useStore } from '../store/useStore'
import { useCamera } from '../hooks/useCamera'
import { track } from '../lib/analytics'

type Step = 'team' | 'photo' | 'preview'

// ─── Team Selection ────────────────────────────────────────────────────────────
function TeamStep({ onSelect }: { onSelect: (team: Team) => void }) {
  const [selected, setSelected] = useState<Team | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
        Pick your team
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
        Your card will use your team's colours.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-3)',
        flex: 1,
        overflowY: 'auto',
        marginBottom: 'var(--space-6)',
      }}>
        {TEAMS.map(team => (
          <button
            key={team.id}
            onClick={() => setSelected(team)}
            style={{
              background: selected?.id === team.id ? 'var(--color-surface)' : 'transparent',
              border: `2px solid ${selected?.id === team.id ? team.accent : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'border-color var(--transition-fast)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 36 }}>{team.flag}</span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}>
              {team.name}
            </span>
          </button>
        ))}
      </div>

      <Button
        fullWidth
        disabled={!selected}
        onClick={() => {
          if (!selected) return
          track('team_selected', { teamId: selected.id })
          onSelect(selected)
        }}
      >
        Continue
      </Button>
    </div>
  )
}

// ─── Photo Capture ─────────────────────────────────────────────────────────────
function PhotoStep({ team, onCapture }: { team: Team; onCapture: (dataUrl: string) => void }) {
  const { videoRef, status, start, stop, capture } = useCamera()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCapture() {
    const dataUrl = capture()
    if (dataUrl) {
      stop()
      track('photo_captured', { method: 'camera' })
      onCapture(dataUrl)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      track('photo_captured', { method: 'file_input' })
      onCapture(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const showFallback = status === 'denied' || status === 'unavailable'
  const showError = status === 'error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span style={{ fontSize: 24 }}>{team.flag}</span>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Take your selfie</h2>
      </div>

      {/* Camera viewfinder */}
      <div style={{
        flex: 1,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-4)',
      }}>
        {status === 'active' ? (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : status === 'requesting' ? (
          <Spinner size={40} />
        ) : showFallback ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📷</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
              {status === 'denied'
                ? 'Camera access denied. Upload a photo instead.'
                : 'Camera not available. Upload a photo instead.'}
            </p>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Choose photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : showError ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
              Camera error. Please try again.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📸</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Tap below to start camera
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'active' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button fullWidth onClick={handleCapture}>Capture</Button>
          <Button variant="ghost" fullWidth onClick={stop}>Cancel</Button>
        </div>
      ) : !showFallback ? (
        <Button fullWidth onClick={start}>
          {showError ? 'Retry camera' : 'Start camera'}
        </Button>
      ) : null}
    </div>
  )
}

// ─── Card Preview ──────────────────────────────────────────────────────────────
function PreviewStep({
  team,
  photoDataUrl,
  onRetake,
  onConfirm,
}: {
  team: Team
  photoDataUrl: string
  onRetake: () => void
  onConfirm: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
        Your fan card
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
        Looking good! Confirm to save your card.
      </p>

      {/* Card preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{
          width: 220,
          height: 300,
          borderRadius: 'var(--radius-lg)',
          background: team.gradient,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          boxShadow: `0 20px 60px ${team.accent}40`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Team flag watermark */}
          <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 28, opacity: 0.4 }}>
            {team.flag}
          </div>

          {/* Photo circle */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <img src={photoDataUrl} alt="Your selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Team name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {team.name}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              FanZone 2026
            </div>
          </div>

          {/* Accent stripe */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 4,
            background: 'rgba(255,255,255,0.5)',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Button fullWidth onClick={onConfirm}>Confirm &amp; Save</Button>
        <Button variant="secondary" fullWidth onClick={onRetake}>Retake photo</Button>
      </div>
    </div>
  )
}

// ─── Identity Route ────────────────────────────────────────────────────────────
export default function Identity() {
  const navigate = useNavigate()
  const { updateFanCard } = useStore()
  const [step, setStep] = useState<Step>('team')
  const [team, setTeam] = useState<Team | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)

  function handleTeamSelect(t: Team) {
    setTeam(t)
    setStep('photo')
  }

  function handlePhotoCapture(dataUrl: string) {
    setPhotoDataUrl(dataUrl)
    setStep('preview')
  }

  function handleConfirm() {
    if (!team || !photoDataUrl) return
    // Idempotent save — plain object merge, no duplicates possible
    updateFanCard({ teamId: team.id, photoDataUrl })
    track('fan_card_saved', { teamId: team.id })
    navigate('/card')
  }

  return (
    <Screen>
      {step === 'team' && <TeamStep onSelect={handleTeamSelect} />}
      {step === 'photo' && team && (
        <PhotoStep team={team} onCapture={handlePhotoCapture} />
      )}
      {step === 'preview' && team && photoDataUrl && (
        <PreviewStep
          team={team}
          photoDataUrl={photoDataUrl}
          onRetake={() => setStep('photo')}
          onConfirm={handleConfirm}
        />
      )}
    </Screen>
  )
}
