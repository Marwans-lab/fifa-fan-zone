import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import cameraIcon from '../assets/icons/camera-white.svg'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

type Phase = 'ready' | 'live' | 'preview'

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

// ─── Viewfinder frame (decorative corner marks) ──────────────────────────────
function ViewfinderFrame() {
  const cornerStyle = (
    top: boolean,
    left: boolean,
  ): React.CSSProperties => ({
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'var(--c-accent)',
    borderStyle: 'solid',
    borderWidth: 0,
    ...(top ? { top: -1 } : { bottom: -1 }),
    ...(left ? { left: -1 } : { right: -1 }),
    ...(top && left ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 'var(--r-md)' } : {}),
    ...(top && !left ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 'var(--r-md)' } : {}),
    ...(!top && left ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 'var(--r-md)' } : {}),
    ...(!top && !left ? { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 'var(--r-md)' } : {}),
  })

  return (
    <>
      <div style={cornerStyle(true, true)} />
      <div style={cornerStyle(true, false)} />
      <div style={cornerStyle(false, true)} />
      <div style={cornerStyle(false, false)} />
    </>
  )
}

// ─── Shutter button ──────────────────────────────────────────────────────────
function ShutterButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Take photo"
      style={{
        width: 72,
        height: 72,
        borderRadius: 'var(--r-full)',
        background: 'none',
        border: '3px solid var(--c-accent)',
        padding: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: `opacity var(--dur-base) var(--ease-out)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--r-full)',
          background: 'var(--c-accent)',
          transition: `transform var(--dur-base) var(--ease-out)`,
        }}
      />
    </button>
  )
}

// ─── Main Picture route ──────────────────────────────────────────────────────
export default function Picture() {
  const navigate = useNavigate()
  const location = useLocation()
  const { teamId } = (location.state as { teamId: string } | null) ?? { teamId: '' }

  const [phase, setPhase] = useState<Phase>('ready')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Camera lifecycle ─────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // Attach stream to video once it renders
  useEffect(() => {
    if (phase === 'live' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [phase])

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
      setPhase('live')
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
    setPhase('preview')
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
        setPhase('preview')
        track('picture_photo_picked')
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRetake = useCallback(() => {
    setPhotoDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    stopCamera()
    setPhase('ready')
    track('picture_retake_tapped')
  }, [stopCamera])

  const handleConfirm = useCallback(() => {
    track('picture_confirmed')
    navigate('/identity', { state: { teamId, photoDataUrl }, replace: true })
  }, [navigate, teamId, photoDataUrl])

  const handleBack = useCallback(() => {
    stopCamera()
    navigate('/identity', { replace: true })
  }, [navigate, stopCamera])

  // ── Viewfinder size (square, fits mobile width with padding) ─────────
  const VIEWFINDER_SIZE = 280

  return (
    <Screen>
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          padding: 'var(--sp-6) var(--sp-5)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          marginBottom: 'var(--sp-8)',
        }}>
          <button
            onClick={handleBack}
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--sp-2)',
              marginLeft: 'calc(-1 * var(--sp-2))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img src={chevLeft} width={24} height={24} alt="" />
          </button>
          <h2 style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--c-text-1)',
            marginRight: 24,
          }}>
            {phase === 'preview' ? 'Looking good!' : 'Take a selfie'}
          </h2>
        </div>

        {/* ── Subtitle ────────────────────────────────────────────── */}
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--c-text-2)',
          textAlign: 'center',
          marginBottom: 'var(--sp-8)',
        }}>
          {phase === 'preview'
            ? 'This photo will appear on your fan card'
            : phase === 'live'
              ? 'Position your face in the frame'
              : 'Your photo will be shown on your fan card'}
        </p>

        {/* ── Viewfinder area ─────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          width: VIEWFINDER_SIZE,
          height: VIEWFINDER_SIZE,
          borderRadius: 'var(--r-full)',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--c-border)',
          flexShrink: 0,
        }}>
          {/* Corner frame marks (outside the clip) */}
          <div style={{ position: 'absolute', inset: 'var(--sp-3)', pointerEvents: 'none', zIndex: 2 }}>
            <ViewfinderFrame />
          </div>

          {phase === 'live' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transform: 'scaleX(-1)',
              }}
            />
          ) : phase === 'preview' && photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt="Your photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
          ) : (
            /* Ready state — tap to start */
            <button
              onClick={startCamera}
              aria-label="Open camera"
              style={{
                width: '100%',
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--sp-3)',
                color: 'var(--c-text-2)',
                fontFamily: 'inherit',
              }}
            >
              <img src={cameraIcon} width={40} height={40} alt="" style={{ opacity: 0.6 }} />
              <span style={{
                fontSize: 'var(--text-xs)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
              }}>
                Tap to start
              </span>
            </button>
          )}
        </div>

        {/* ── Camera error message ────────────────────────────────── */}
        {cameraError && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-warn)',
            marginTop: 'var(--sp-3)',
            textAlign: 'center',
          }}>
            {cameraError}
          </p>
        )}

        {/* ── Hidden file input fallback ──────────────────────────── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-4)',
          marginTop: 'auto',
          paddingTop: 'var(--sp-8)',
          paddingBottom: 'var(--sp-4)',
          width: '100%',
          maxWidth: 320,
        }}>
          {phase === 'live' && (
            <ShutterButton onClick={capturePhoto} />
          )}

          {phase === 'preview' && (
            <>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Use this photo
              </button>
              <button
                onClick={handleRetake}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Retake
              </button>
            </>
          )}

          {phase === 'ready' && (
            <button
              onClick={() => handleConfirm()}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </Screen>
  )
}
