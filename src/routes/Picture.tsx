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
      className="picture-silhouette-svg"
      width="180"
      height="220"
      viewBox="0 0 180 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.35, color: 'var(--f-brand-color-text-disabled)' }}
    >
      {/* Head */}
      <circle
        className="picture-silhouette-head"
        cx="90"
        cy="70"
        r="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
      {/* Shoulders */}
      <path
        className="picture-silhouette-shoulders"
        d="M20 210 C20 170, 45 145, 90 140 C135 145, 160 170, 160 210"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
    </svg>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="picture-progress-track"
      style={{
        flex: 1,
        height: 8,
        borderRadius: 'var(--f-brand-radius-rounded)',
        background: 'var(--f-brand-color-border-default)',
        overflow: 'hidden',
      }}
    >
      <div
        className="picture-progress-fill"
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 'var(--f-brand-radius-rounded)',
          background: 'linear-gradient(-90deg, var(--f-brand-color-border-success) 61.5%, var(--f-brand-color-background-success) 100%)',
          boxShadow: 'var(--f-brand-shadow-medium)',
          transition: `width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)`,
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
    navigate('/identity', { replace: true })
  }, [navigate, stopCamera])

  const hasPhoto = !!photoDataUrl

  return (
    <div
      data-page="picture"
      className="f-page-enter picture-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--f-brand-color-background-default)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── Top bar: back button + progress ──────────────────── */}
      <div data-section="header" className="picture-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--f-brand-space-md)',
        padding: 'var(--sp-18) var(--f-brand-space-md) 0 var(--f-brand-space-md)',
        flexShrink: 0,
      }}>
        <button
          data-ui="back-btn"
          className="picture-back-btn"
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 'var(--sp-12)',
            height: 'var(--sp-12)',
            borderRadius: 'var(--f-brand-radius-rounded)',
            background: 'var(--f-brand-color-text-light)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--f-brand-shadow-medium)',
          }}
        >
          <img
            className="picture-back-icon"
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
      <h2 data-section="title" className="picture-title" style={{
        font: 'var(--f-brand-type-title-2)',
        color: 'var(--f-brand-color-text-default)',
        textAlign: 'center',
        marginTop: 'var(--f-brand-space-lg)',
        flexShrink: 0,
      }}>
        Add your picture
      </h2>

      {/* ── Photo card ───────────────────────────────────────── */}
      <div data-section="camera-preview" className="picture-camera-preview" style={{
        margin: 'var(--f-brand-space-lg) var(--f-brand-space-md) 0',
        background: 'var(--f-brand-color-text-light)',
        borderRadius: 'var(--f-brand-radius-small)',
        height: 515,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {cameraActive && !hasPhoto ? (
          /* Live camera feed */
          <div className="picture-camera-feed" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}>
            <video
              className="picture-camera-video"
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
              data-ui="capture-photo-btn"
              className="picture-capture-btn"
              onClick={capturePhoto}
              aria-label="Capture photo"
              style={{
                position: 'absolute',
                bottom: 'var(--f-brand-space-xl)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'var(--sp-18)',
                height: 'var(--sp-18)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'none',
                border: 'var(--c-capture-ring) solid var(--f-brand-color-text-light)',
                padding: 'var(--sp-1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="picture-capture-btn-inner" style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'var(--f-brand-color-text-light)',
              }} />
            </button>
          </div>
        ) : hasPhoto ? (
          /* Photo preview */
          <div className="picture-photo-preview" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}>
            <img
              className="picture-photo-img"
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
              data-ui="retake-photo-btn"
              className="picture-retake-btn"
              onClick={handleRetake}
              aria-label="Retake photo"
              style={{
                position: 'absolute',
                bottom: 'var(--f-brand-space-md)',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: 'var(--f-brand-space-xs) var(--f-brand-space-md)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(var(--f-brand-blur-subtle))',
                WebkitBackdropFilter: 'blur(var(--f-brand-blur-subtle))',
                border: '1px solid var(--c-lt-overlay-border)',
                color: 'var(--f-brand-color-text-light)',
                font: 'var(--f-brand-type-caption-medium)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Retake photo
            </button>
          </div>
        ) : (
          /* Empty state: silhouette + "Take a photo" */
          <>
            <SilhouettePlaceholder />

            <button
              data-ui="take-photo-btn"
              className="picture-take-photo-btn"
              onClick={handleTakePhoto}
              style={{
                position: 'absolute',
                top: 209,
                width: 197,
                height: 'var(--sp-14)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'var(--f-brand-color-primary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--f-brand-space-sm)',
                boxShadow: 'var(--f-brand-shadow-large)',
                color: 'var(--f-brand-color-text-light)',
                font: 'var(--f-brand-type-body-medium)',
              }}
            >
              <span className="picture-take-photo-label">Take a photo</span>
              <img className="picture-take-photo-icon" src={cameraIcon} width={24} height={24} alt="" />
            </button>
          </>
        )}
      </div>

      {/* ── Camera error ─────────────────────────────────────── */}
      {cameraError && (
        <p className="picture-camera-error" style={{
          font: 'var(--f-brand-type-caption)',
          fontSize: 'var(--text-xs)',
          color: 'var(--f-brand-color-status-error)',
          marginTop: 'var(--f-brand-space-xs)',
          textAlign: 'center',
          padding: '0 var(--f-brand-space-md)',
        }}>
          {cameraError}
        </p>
      )}

      {/* ── Hidden file input fallback ───────────────────────── */}
      <input
        className="picture-file-input"
        data-ui="file-upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Next button ──────────────────────────────────────── */}
      <div data-section="controls" className="picture-controls" style={{
        padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) var(--f-brand-space-xl)',
        flexShrink: 0,
      }}>
        <button
          className="picture-confirm-btn"
          data-ui="confirm-photo-btn"
          onClick={handleNext}
          disabled={!hasPhoto}
          style={{
            width: '100%',
            height: 'var(--sp-14)',
            borderRadius: 'var(--f-brand-radius-rounded)',
            background: hasPhoto ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-border-default)',
            border: 'none',
            cursor: hasPhoto ? 'pointer' : 'default',
            color: hasPhoto ? 'var(--f-brand-color-text-light)' : 'var(--f-brand-color-text-disabled)',
            font: 'var(--f-brand-type-body-medium)',
            transition: `background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)`,
          }}
        >
          Confirm photo
        </button>
      </div>
    </div>
  )
}
