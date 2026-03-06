import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS, getTeam } from '../data/teams'
import cameraIcon from '../assets/icons/camera-white.svg'

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
            <img src={cameraIcon} width={28} height={28} alt="" />
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

// ─── Image compression ────────────────────────────────────────────────────────
// Resizes any image to ≤480px on the longest side at 0.78 JPEG quality.
// Keeps base64 output under ~50 KB so it fits in localStorage safely.
function compressDataUrl(source: HTMLVideoElement | HTMLImageElement, flipX = false): string {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth  : source.naturalWidth
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const MAX = 480
  const scale = Math.min(MAX / sw, MAX / sh, 1)
  const w = Math.round(sw * scale)
  const h = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  if (flipX) { ctx.translate(w, 0); ctx.scale(-1, 1) }
  ctx.drawImage(source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.78)
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

  // Attach stream to video element once it is rendered
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraActive])

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
      // stream is attached in the useEffect below, after the video element mounts
      track('identity_camera_started')
    } catch {
      // getUserMedia denied or unavailable — fall back to file picker
      setCameraError('Camera unavailable — picking from files instead')
      fileInputRef.current?.click()
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || !video.videoWidth) return
    const url = compressDataUrl(video, true /* un-mirror */)
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
      const img = new Image()
      img.onload = () => {
        const url = compressDataUrl(img)
        setPhotoDataUrl(url)
        setStep('preview')
        track('identity_photo_taken')
      }
      img.src = ev.target?.result as string
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
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-4)' }}>
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

  // ── Step: camera ───────────────────────────────────────────────────────────
  if (step === 'camera') {
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
            className="btn btn-ghost"
            style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}
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
