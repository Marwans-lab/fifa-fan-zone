import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS, getTeam } from '../data/teams'

type Step = 'team' | 'camera' | 'preview'

// ─── Card preview component ────────────────────────────────────────────────────
function CardPreview({
  teamId,
  photoDataUrl,
  videoRef,
  cameraActive,
  onTakePhoto,
}: {
  teamId: string
  photoDataUrl: string | null
  videoRef?: React.RefObject<HTMLVideoElement>
  cameraActive?: boolean
  onTakePhoto?: () => void
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

      {/* Photo / live camera / take-picture CTA */}
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
        ) : cameraActive && videoRef ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'center',
              border: '3px solid rgba(255,255,255,0.55)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              transform: 'scaleX(-1)', // mirror for selfie
            }}
          />
        ) : (
          <button
            onClick={onTakePhoto}
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.28)',
              border: '2px dashed rgba(255,255,255,0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              gap: 6,
              fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'background var(--dur-base) var(--ease-out)',
            }}
          >
            <span style={{ fontSize: 28 }}>📷</span>
            <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, lineHeight: 1.2, textAlign: 'center' }}>
              Take<br />Picture
            </span>
          </button>
        )}
      </div>

      {/* Team motto */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: 1, marginBottom: 2, fontStyle: 'italic' }}>
          {team.motto}
        </div>
      </div>
    </div>
  )
}

// ─── Main Identity route ───────────────────────────────────────────────────────
export default function Identity() {
  const navigate = useNavigate()
  const { updateFanCard } = useStore()

  const [step, setStep] = useState<Step>('team')
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = WORLD_CUP_TEAMS.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  // Stop camera stream when leaving camera step
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      // Fallback to file picker
      fileInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = stream
      setCameraActive(true)
      // attach stream to video element after next tick
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      track('identity_camera_started')
    } catch {
      // getUserMedia denied or unavailable — fall back to file picker
      setCameraError('Camera unavailable — picking from files instead')
      fileInputRef.current?.click()
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 640
    const ctx = canvas.getContext('2d')!
    // un-mirror the capture (flip back)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', 0.92)
    stopCamera()
    setPhotoDataUrl(url)
    setStep('preview')
    track('identity_photo_captured')
  }, [stopCamera])

  function handleTeamSelect(id: string) {
    setSelectedTeamId(id)
    setStep('camera')
    track('identity_team_selected', { teamId: id })
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setPhotoDataUrl(url)
      setStep('preview')
      track('identity_photo_taken')
    }
    reader.readAsDataURL(file)
  }, [])

  function handleContinue() {
    if (!selectedTeamId) return
    updateFanCard({ teamId: selectedTeamId, photoDataUrl })
    track('identity_continue_tapped', { teamId: selectedTeamId })
    navigate('/card')
  }

  function handleRetake() {
    setPhotoDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    stopCamera()
    setStep('camera')
    track('identity_retake_tapped')
  }

  // ── Step: team selection ───────────────────────────────────────────────────
  if (step === 'team') {
    return (
      <Screen>
        <div style={{
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
              style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-full)',
                color: 'var(--c-text-1)',
                fontSize: 'var(--text-md)',
                fontFamily: 'inherit',
                outline: 'none',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
              }}
            />
          </div>

          {/* Team list — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
            {filtered.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--c-text-1)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  textAlign: 'left',
                  flexShrink: 0,
                  boxShadow: 'var(--glass-shine)',
                  transition: 'background var(--dur-base) var(--ease-out)',
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

  // ── Step: camera ───────────────────────────────────────────────────────────
  if (step === 'camera') {
    return (
      <Screen centered>
        <div style={{ padding: 'var(--sp-8) var(--sp-5)', textAlign: 'center', maxWidth: 340, width: '100%' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--sp-2)',
          }}>
            {cameraActive ? 'Strike a pose!' : 'Take your selfie'}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginBottom: 'var(--sp-6)' }}>
            {cameraActive ? 'Tap Capture when ready' : 'Tap the card to start your camera'}
          </p>

          <CardPreview
            teamId={selectedTeamId!}
            photoDataUrl={null}
            videoRef={videoRef}
            cameraActive={cameraActive}
            onTakePhoto={startCamera}
          />

          {/* Hidden canvas for capturing frame */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Hidden file input fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {cameraError && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-warn)', marginTop: 'var(--sp-3)' }}>
              {cameraError}
            </p>
          )}

          {cameraActive && (
            <button
              onClick={capturePhoto}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--sp-5)' }}
            >
              📸 Capture
            </button>
          )}

          <button
            onClick={() => { stopCamera(); setStep('team') }}
            style={{
              marginTop: 'var(--sp-4)',
              background: 'none', border: 'none',
              color: 'var(--c-text-2)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Change team
          </button>
        </div>
      </Screen>
    )
  }

  // ── Step: preview ──────────────────────────────────────────────────────────
  return (
    <Screen centered>
      <div style={{ padding: 'var(--sp-8) var(--sp-5)', textAlign: 'center', maxWidth: 340, width: '100%' }}>
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
            Continue →
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
