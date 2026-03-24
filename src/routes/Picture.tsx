import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
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

// ─── Silhouette SVG (dashed outline of head + shoulders) ─────────────────────
function SilhouettePlaceholder() {
  return (
    <svg
      width="180"
      height="220"
      viewBox="0 0 180 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.35 }}
    >
      {/* Head */}
      <circle
        cx="90"
        cy="70"
        r="42"
        stroke="var(--c-lt-text-2)"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
      {/* Shoulders */}
      <path
        d="M20 210 C20 170, 45 145, 90 140 C135 145, 160 170, 160 210"
        stroke="var(--c-lt-text-2)"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
    </svg>
  )
}

// ─── Progress bar (FDS burgundy brand fill) ──────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        flex: 1,
        height: 8,
        borderRadius: 'var(--r-full)',
        background: 'var(--c-lt-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 'var(--r-full)',
          background: 'var(--c-lt-brand)',
          transition: `width var(--dur-slow) var(--ease-out)`,
        }}
      />
    </div>
  )
}

// ─── Main Picture route ──────────────────────────────────────────────────────
export default function Picture() {
  const navigate = useNavigate()
  const location = useLocation()
  const { teamId } = (location.state as { teamId: string } | null) ?? { teamId: '' }

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

  const handleBack = useCallback(() => {
    stopCamera()
    navigate('/team-selection')
  }, [navigate, stopCamera])

  const hasPhoto = !!photoDataUrl

  return (
    <div
      className="page-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--c-lt-bg)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── Top bar: back button + progress ──────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        padding: '70px var(--sp-4) 0 var(--sp-4)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 48,
            height: 48,
            minWidth: 44,
            minHeight: 44,
            borderRadius: 'var(--r-full)',
            background: 'var(--c-lt-surface)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px var(--c-lt-shadow)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <img
            src={chevLeft}
            width={24}
            height={24}
            alt=""
            style={{ filter: 'brightness(0)' }}
          />
        </button>

        <ProgressBar progress={50} />
      </div>

      {/* ── Title ────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-thin)',
        lineHeight: '36px',
        color: 'var(--c-lt-text-1)',
        textAlign: 'center',
        marginTop: 'var(--sp-6)',
        flexShrink: 0,
      }}>
        Add your picture
      </h2>

      {/* ── Photo card — FDS surface with dashed border ──────── */}
      <div style={{
        margin: 'var(--sp-6) var(--sp-4) 0',
        background: 'var(--c-lt-surface)',
        borderRadius: 'var(--r-xl)',
        height: 515,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        border: !cameraActive && !hasPhoto
          ? '2px dashed var(--c-lt-border)'
          : 'none',
      }}>
        {cameraActive && !hasPhoto ? (
          /* Live camera feed */
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}>
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
            {/* Capture button overlay */}
            <button
              onClick={capturePhoto}
              aria-label="Capture photo"
              style={{
                position: 'absolute',
                bottom: 'var(--sp-8)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 72,
                height: 72,
                minWidth: 44,
                minHeight: 44,
                borderRadius: 'var(--r-full)',
                background: 'none',
                border: '3px solid var(--c-lt-surface)',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--r-full)',
                background: 'var(--c-lt-surface)',
              }} />
            </button>
          </div>
        ) : hasPhoto ? (
          /* Photo preview */
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}>
            <img
              src={photoDataUrl!}
              alt="Your photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
            {/* Retake overlay button */}
            <button
              onClick={handleRetake}
              aria-label="Retake photo"
              style={{
                position: 'absolute',
                bottom: 'var(--sp-4)',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: 'var(--sp-2) var(--sp-5)',
                minHeight: 44,
                borderRadius: 'var(--r-full)',
                background: 'var(--c-lt-overlay-heavy)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid var(--c-lt-overlay-border)',
                color: 'var(--c-lt-surface)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-med)',
                cursor: 'pointer',
                letterSpacing: 'var(--tracking-wide)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retake
            </button>
          </div>
        ) : (
          /* Empty state: silhouette + "Take a photo" */
          <>
            <SilhouettePlaceholder />

            <button
              onClick={handleTakePhoto}
              style={{
                position: 'absolute',
                top: 209,
                width: 197,
                height: 56,
                minHeight: 44,
                borderRadius: 'var(--r-full)',
                background: 'var(--c-lt-brand)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--sp-3)',
                boxShadow: '0 8px 16px var(--c-lt-shadow)',
                color: 'var(--c-lt-surface)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-med)',
                lineHeight: '24px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span>Take a photo</span>
              <img src={cameraIcon} width={24} height={24} alt="" />
            </button>
          </>
        )}
      </div>

      {/* ── Camera error ─────────────────────────────────────── */}
      {cameraError && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--c-error)',
          marginTop: 'var(--sp-2)',
          textAlign: 'center',
          padding: '0 var(--sp-4)',
          fontFamily: 'var(--font-body)',
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

      {/* ── Next button — FDS primary ────────────────────────── */}
      <div style={{
        padding: 'var(--sp-6) var(--sp-4) var(--sp-8)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleNext}
          disabled={!hasPhoto}
          style={{
            width: '100%',
            height: 56,
            minHeight: 44,
            borderRadius: 'var(--r-full)',
            background: hasPhoto ? 'var(--c-lt-brand)' : 'var(--c-lt-border)',
            border: 'none',
            cursor: hasPhoto ? 'pointer' : 'default',
            color: hasPhoto ? 'var(--c-lt-surface)' : 'var(--c-lt-text-2)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-med)',
            lineHeight: '24px',
            transition: `background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
