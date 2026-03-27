import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { getTeam } from '../data/teams'
import cameraIcon from '../assets/icons/camera-white.svg'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

// ─── Image compression ────────────────────────────────────────────────────────
function compressDataUrl(source: HTMLVideoElement | HTMLImageElement, flipX = false): string {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const MAX = 480
  const scale = Math.min(MAX / sw, MAX / sh, 1)
  const w = Math.round(sw * scale)
  const h = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  if (flipX) { ctx.translate(w, 0); ctx.scale(-1, 1) }
  ctx.drawImage(source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.78)
}

// ─── Main Picture route ──────────────────────────────────────────────────────
export default function Picture() {
  const navigate = useNavigate()
  const location = useLocation()
  const { teamId } = (location.state as { teamId: string } | null) ?? { teamId: '' }

  const team = teamId ? getTeam(teamId) : null

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cameraActive, setCameraActive] = useState(false)

  // ── Camera lifecycle ─────────────────────────────────────────────────────
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

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraActive])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = stream
      setCameraActive(true)
      track('picture_camera_started')
    } catch {
      setCameraError('Camera unavailable — pick from files instead')
      fileInputRef.current?.click()
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || !video.videoWidth) return
    const url = compressDataUrl(video, true)
    stopCamera()
    setPhotoDataUrl(url)
    track('picture_photo_captured')
  }, [stopCamera])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const url = compressDataUrl(img)
        setPhotoDataUrl(url)
        track('picture_photo_picked')
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const handleTakePhoto = useCallback(() => {
    if (cameraActive) {
      capturePhoto()
    } else {
      startCamera()
    }
  }, [cameraActive, capturePhoto, startCamera])

  const handleRetake = useCallback(() => {
    setPhotoDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    stopCamera()
    track('picture_retake_tapped')
  }, [stopCamera])

  const handleNext = useCallback(() => {
    track('picture_confirmed')
    navigate('/identity', { state: { teamId, photoDataUrl }, replace: true })
  }, [navigate, teamId, photoDataUrl])

  const handleChangeTeam = useCallback(() => {
    stopCamera()
    navigate('/identity', { replace: true })
  }, [navigate, stopCamera])

  const hasPhoto = !!photoDataUrl

  // Card gradient from team colors
  const cardBg = team
    ? `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
    : 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'

  const cardShadow = team
    ? `0 16px 48px ${team.colors[0]}55, inset 0 1px 0 var(--c-card-inset)`
    : '0 16px 48px var(--c-card-shadow), inset 0 1px 0 var(--c-card-inset)'

  return (
    <div
      className="f-page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        background: 'var(--f-brand-color-background-default)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── Back button (top-left) ──────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 'var(--f-brand-space-lg)',
        left: 'var(--f-brand-space-md)',
        zIndex: 10,
      }}>
        <button
          onClick={handleChangeTeam}
          aria-label="Go back"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--c-surface)',
            border: '1px solid var(--glass-bg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={chevLeft} width={20} height={20} alt="" />
        </button>
      </div>

      {/* ── Spacer ─────────────────────────────────────────── */}
      <div style={{ flex: '0 0 100px' }} />

      {/* ── Title ────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: 'var(--f-base-type-family-primary)',
        fontSize: 28,
        fontWeight: 100,
        lineHeight: '36px',
        color: 'var(--f-brand-color-text-light)',
        textAlign: 'center',
        marginBottom: 'var(--f-brand-space-xs)',
      }}>
        Take your selfie
      </h2>
      <p style={{
        fontFamily: 'var(--f-base-type-family-secondary)',
        fontSize: 14,
        color: 'var(--c-text-2)',
        textAlign: 'center',
        marginBottom: 'var(--f-brand-space-lg)',
      }}>
        Tap the card to take a photo
      </p>

      {/* ── Card preview ────────────────────────────────────── */}
      <div
        onClick={hasPhoto ? undefined : handleTakePhoto}
        onKeyDown={hasPhoto ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTakePhoto() } }}
        role="button"
        tabIndex={hasPhoto ? undefined : 0}
        aria-label={hasPhoto ? 'Your photo' : 'Take a photo'}
        style={{
          width: 'calc(100% - var(--f-brand-space-lg) * 2)',
          maxWidth: 360,
          aspectRatio: '5 / 7',
          borderRadius: 'var(--f-brand-radius-outer)',
          background: cardBg,
          border: '1px solid var(--c-card-border)',
          boxShadow: cardShadow,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) var(--f-brand-space-md)',
          position: 'relative',
          overflow: 'hidden',
          cursor: hasPhoto ? 'default' : 'pointer',
        }}
      >
        {/* Card textures */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-outer)', pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, var(--c-card-dot) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          mixBlendMode: 'overlay',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-outer)', pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, var(--c-card-stripe) 18px, var(--c-card-stripe) 19px)',
          mixBlendMode: 'overlay',
        }} />

        {/* Holographic stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, transparent, var(--c-card-holo), transparent)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: 14, letterSpacing: 3, color: 'var(--f-brand-color-text-light)',
            textTransform: 'uppercase', fontFamily: 'var(--f-base-type-family-secondary)',
            fontWeight: 400,
          }}>
            FIFA Fan Zone
          </div>
          <div style={{
            fontSize: 11, color: 'var(--f-brand-color-text-light)',
            opacity: 0.67, letterSpacing: 1, fontStyle: 'italic',
          }}>
            Collector Edition
          </div>
        </div>

        {/* Photo circle / camera prompt */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'var(--f-brand-space-md)', position: 'relative', zIndex: 2,
        }}>
          {cameraActive && !hasPhoto ? (
            /* Live camera feed in circular frame */
            <div style={{
              width: 180, height: 180, borderRadius: '50%',
              border: '2px dashed var(--c-card-dash)',
              overflow: 'hidden', position: 'relative',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  transform: 'scaleX(-1)',
                }}
              />
              {/* Capture button overlay */}
              <button
                onClick={(e) => { e.stopPropagation(); capturePhoto() }}
                aria-label="Capture photo"
                style={{
                  position: 'absolute', bottom: 8, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--c-card-capture-bg)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '2px solid var(--f-brand-color-text-light)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--f-brand-color-text-light)',
                }} />
              </button>
            </div>
          ) : hasPhoto ? (
            /* Photo preview */
            <div style={{ position: 'relative' }}>
              <img
                src={photoDataUrl!}
                alt="Your photo"
                style={{
                  width: 180, height: 180, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: '3px solid var(--c-card-photo-border)',
                  boxShadow: 'var(--c-card-photo-shadow)',
                }}
              />
              {/* Retake overlay */}
              <button
                onClick={(e) => { e.stopPropagation(); handleRetake() }}
                aria-label="Retake photo"
                style={{
                  position: 'absolute', bottom: -8, left: '50%',
                  transform: 'translateX(-50%)',
                  padding: 'var(--f-brand-space-2xs) var(--f-brand-space-sm)',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  background: 'var(--c-card-overlay-heavy)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid var(--c-card-overlay-border)',
                  color: 'var(--f-brand-color-text-light)',
                  fontFamily: 'var(--f-base-type-family-secondary)',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Retake
              </button>
            </div>
          ) : (
            /* Empty state: dashed circle with camera icon + TAKE PICTURE */
            <div
              style={{
                width: 180, height: 180, borderRadius: '50%',
                background: 'var(--c-card-overlay)',
                border: '2px dashed var(--c-card-dash)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 'var(--f-brand-space-xs)',
              }}
            >
              <img src={cameraIcon} width={28} height={28} alt="" style={{ opacity: 0.7 }} />
              <span style={{
                fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                color: 'var(--f-brand-color-text-light)', opacity: 0.7,
                fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: 500,
                textAlign: 'center', lineHeight: 1.4,
              }}>
                Take{'\n'}Picture
              </span>
            </div>
          )}
        </div>

        {/* Team name at bottom of card */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--f-brand-space-xs)', position: 'relative', zIndex: 2,
        }}>
          {team ? (
            <>
              <span style={{ fontSize: 18 }}>{team.flag}</span>
              <span style={{
                fontSize: 16, fontWeight: 600, letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--f-brand-color-text-light)',
                fontFamily: 'var(--f-base-type-family-secondary)',
              }}>
                {team.name}
              </span>
            </>
          ) : (
            <span style={{
              fontSize: 12, color: 'var(--c-text-3)', fontStyle: 'italic',
            }}>
              No team selected
            </span>
          )}
        </div>
      </div>

      {/* ── Camera error ─────────────────────────────────────── */}
      {cameraError && (
        <p style={{
          fontSize: 11, color: 'var(--f-brand-color-status-error)',
          marginTop: 'var(--f-brand-space-xs)', textAlign: 'center',
          padding: '0 var(--f-brand-space-md)',
        }}>
          {cameraError}
        </p>
      )}

      {/* ── Hidden file input fallback ───────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Change team link ─────────────────────────────────── */}
      <button
        onClick={handleChangeTeam}
        style={{
          marginTop: 'var(--f-brand-space-lg)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--f-base-type-family-secondary)',
          fontSize: 14, color: 'var(--c-text-2)',
          display: 'flex', alignItems: 'center',
          gap: 'var(--f-brand-space-2xs)',
        }}
      >
        ← Change team
      </button>

      {/* ── Next button (visible when photo taken) ──────────── */}
      {hasPhoto && (
        <div style={{
          width: '100%',
          padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) var(--f-brand-space-xl)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleNext}
            style={{
              width: '100%', height: 56,
              borderRadius: 'var(--f-brand-radius-rounded)',
              background: 'var(--f-brand-color-text-light)',
              border: 'none', cursor: 'pointer',
              color: 'var(--f-brand-color-primary)',
              fontFamily: 'var(--f-base-type-family-secondary)',
              fontSize: 16, fontWeight: 600, lineHeight: '24px',
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Spacer at bottom */}
      {!hasPhoto && <div style={{ flex: 1 }} />}
    </div>
  )
}
