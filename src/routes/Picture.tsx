import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { removeBackground } from '@imgly/background-removal'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import FanCard from '../components/FanCard'
import Button from '../components/Button'
import { getTeam } from '../data/teams'
import cameraIcon from '../assets/icons/camera-white.svg'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

// Model files are self-hosted under <origin><base>bg-removal/.
// publicPath must be absolute — the library calls new URL(hash, publicPath) which requires an absolute base.
const BG_REMOVAL_PUBLIC_PATH = window.location.origin + import.meta.env.BASE_URL + 'bg-removal/'

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

function getTeamCardBackground(teamId: string): string {
  const team = getTeam(teamId)
  if (team) {
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
  }
  return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'
}

// ─── Portrait placeholder SVG ─────────────────────────────────────────────────
function PortraitPlaceholder() {
  return (
    <svg className="picture-silhouette-svg"
      width="200"
      height="260"
      viewBox="0 0 200 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.55, color: 'var(--f-brand-color-text-light)' }}
    >
      <rect
        x="14"
        y="10"
        width="172"
        height="240"
        rx="86"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
      <circle
        className="picture-silhouette-head"
        cx="100"
        cy="92"
        r="40"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 6"
        fill="none"
      />
      <path className="picture-silhouette-shoulders"
        d="M42 236C42 188 68 160 100 160C132 160 158 188 158 236"
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
    <div className="picture-progress-track"
      style={{
        flex: 1,
        height: 8,
        borderRadius: 'var(--f-brand-radius-rounded)',
        background: 'var(--f-brand-color-border-default)',
        overflow: 'hidden',
      }}
    >
      <div className="picture-progress-fill"
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
  const { state, updateFanCard } = useStore()

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [bgError, setBgError] = useState<string | null>(null)

  const processPhoto = useCallback(async (rawDataUrl: string) => {
    setRemovingBg(true)
    setBgProgress(0)
    setBgError(null)
    try {
      const blob = await removeBackground(rawDataUrl, {
        publicPath: BG_REMOVAL_PUBLIC_PATH,
        model: 'small',
        proxyToWorker: false,
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setBgProgress(Math.round((current / total) * 100))
        },
      })
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      setPhotoDataUrl(dataUrl)
      setRemovingBg(false)
      track('picture_bg_removed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[bg-removal] failed:', err)
      setBgError(msg)
      setPhotoDataUrl(rawDataUrl)
      setRemovingBg(false)
    }
  }, [])

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
    void processPhoto(url)
    track('picture_photo_captured')
  }, [stopCamera, processPhoto])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const url = compressDataUrl(img)
        void processPhoto(url)
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

  const handleConfirm = useCallback(() => {
    updateFanCard({ photoDataUrl, teamId: teamId || null })
    track('picture_confirmed')
    navigate('/card', { replace: true })
  }, [navigate, updateFanCard, photoDataUrl, teamId])

  const handleBack = useCallback(() => {
    stopCamera()
    navigate(-1)
  }, [navigate, stopCamera])

  // Preview fan card — store data + new photo + teamId
  const previewFanCard = useMemo(() => ({
    ...state.fanCard,
    photoDataUrl,
    teamId: teamId || state.fanCard.teamId,
  }), [state.fanCard, photoDataUrl, teamId])
  const selectedTeam = useMemo(
    () => (teamId ? getTeam(teamId) : state.fanCard.teamId ? getTeam(state.fanCard.teamId) : undefined),
    [teamId, state.fanCard.teamId]
  )
  const teamCardBackground = useMemo(
    () => getTeamCardBackground(selectedTeam?.id ?? ''),
    [selectedTeam?.id]
  )

  const hasPhoto = !!photoDataUrl || removingBg

  return (
    <div className="f-page-enter picture-page"
      data-page="picture"
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
        <button className="picture-back-btn"
          data-ui="back-btn"
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
          <img className="picture-back-icon"
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

      {/* ── Camera / Card preview ────────────────────────────── */}
      {!hasPhoto ? (
        /* Camera */
        <div data-section="camera-preview" className="picture-camera-preview" style={{
          margin: 'var(--f-brand-space-lg) var(--f-brand-space-md) 0',
          background: cameraActive ? 'var(--f-brand-color-text-light)' : 'transparent',
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
          {cameraActive ? (
            <div className="picture-camera-feed" style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video className="picture-camera-video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <button className="picture-capture-btn"
                data-ui="capture-photo-btn"
                onClick={capturePhoto}
                aria-label="Capture photo"
                style={{
                  position: 'absolute', bottom: 'var(--f-brand-space-xl)', left: '50%', transform: 'translateX(-50%)',
                  width: 'var(--sp-18)', height: 'var(--sp-18)', borderRadius: 'var(--f-brand-radius-rounded)',
                  background: 'none', border: 'var(--c-capture-ring) solid var(--f-brand-color-text-light)',
                  padding: 'var(--sp-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: 'var(--f-brand-radius-rounded)', background: 'var(--f-brand-color-text-light)' }} />
              </button>
            </div>
          ) : (
            <div className="picture-team-placeholder-card" style={{
              width: '100%',
              aspectRatio: '5 / 7',
              borderRadius: 'var(--f-brand-radius-outer)',
              background: teamCardBackground,
              border: '1px solid var(--c-card-border)',
              boxShadow: 'var(--f-brand-shadow-large)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--sp-6) var(--sp-4)',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--sp-1)',
                background: 'linear-gradient(90deg, transparent, var(--c-lt-shimmer), transparent)',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, var(--c-lt-shimmer) 1.5px, transparent 1.5px)',
                backgroundSize: 'var(--sp-4) var(--sp-4)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent var(--sp-5), var(--c-lt-shimmer) var(--sp-5), var(--c-lt-shimmer) calc(var(--sp-5) + 1px))',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }} />
              {selectedTeam && (
                <div style={{
                  position: 'absolute',
                  top: 'var(--sp-4)',
                  left: 'var(--sp-4)',
                  right: 'var(--sp-4)',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    padding: 'var(--sp-1) var(--sp-3)',
                    borderRadius: 'var(--f-brand-radius-rounded)',
                    background: 'var(--f-brand-color-background-dark-50a)',
                    color: 'var(--f-brand-color-text-light)',
                    font: 'var(--f-brand-type-subheading-medium)',
                    fontStyle: 'italic',
                  }}>
                    <span aria-hidden="true">{selectedTeam.flag}</span>
                    <span>{selectedTeam.motto}</span>
                  </div>
                </div>
              )}
              <PortraitPlaceholder />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                <Button
                  variant="white-filled"
                  className="picture-take-photo-btn"
                  data-ui="take-photo-btn"
                  onClick={handleTakePhoto}
                  style={{
                    minWidth: 197,
                    minHeight: 'var(--sp-14)',
                    boxShadow: 'var(--f-brand-shadow-large)',
                  }}
                  iconRight={<img src={cameraIcon} width={20} height={20} alt="" style={{ filter: 'brightness(0)' }} />}
                >
                  Take a photo
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : removingBg ? (
        /* BG removal loading */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 'var(--f-brand-space-sm)',
          padding: 'var(--f-brand-space-lg) var(--f-brand-space-md)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--f-brand-color-border-default)',
            borderTopColor: 'var(--f-brand-color-background-primary)',
            animation: 'f-spinner-spin var(--dur-gentle) linear infinite',
          }} />
          <p style={{ font: 'var(--f-brand-type-caption)', color: 'var(--f-brand-color-text-subtle)', margin: 0 }}>
            {bgProgress > 0 && bgProgress < 100 ? `Downloading model ${bgProgress}%…` : 'Removing background…'}
          </p>
          {bgProgress > 0 && bgProgress < 100 && <ProgressBar progress={bgProgress} />}
        </div>
      ) : (
        /* Fan card preview */
        <div data-section="card-preview" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--f-brand-space-md)',
          padding: 'var(--f-brand-space-md) var(--f-brand-space-md) 0',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <FanCard
            fanCard={previewFanCard}
            onSave={() => {}}
          />
        </div>
      )}

      {/* ── Camera error ─────────────────────────────────────── */}
      {cameraError && (
        <p className="picture-camera-error" style={{
          font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-xs)',
          color: 'var(--f-brand-color-status-error)',
          marginTop: 'var(--f-brand-space-xs)', textAlign: 'center',
          padding: '0 var(--f-brand-space-md)',
        }}>
          {cameraError}
        </p>
      )}

      {/* ── Hidden file input ────────────────────────────────── */}
      <input className="picture-file-input"
        data-ui="file-upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Actions ──────────────────────────────────────────── */}
      {hasPhoto && !removingBg && (
        <div data-section="controls" style={{
          display: 'flex', gap: 'var(--f-brand-space-sm)',
          padding: 'var(--f-brand-space-md) var(--f-brand-space-md) var(--f-brand-space-xl)',
          flexShrink: 0,
        }}>
          <button
            data-ui="retake-photo-btn"
            onClick={handleRetake}
            style={{
              flex: 1, height: 'var(--sp-14)', borderRadius: 'var(--f-brand-radius-rounded)',
              background: 'none', border: '1px solid var(--f-brand-color-border-default)',
              cursor: 'pointer', color: 'var(--f-brand-color-text-default)',
              font: 'var(--f-brand-type-body-medium)',
            }}
          >
            Retake photo
          </button>
          <button
            data-ui="confirm-card-btn"
            onClick={handleConfirm}
            style={{
              flex: 1, height: 'var(--sp-14)', borderRadius: 'var(--f-brand-radius-rounded)',
              background: 'var(--f-brand-color-primary)', border: 'none',
              cursor: 'pointer', color: 'var(--f-brand-color-text-light)',
              font: 'var(--f-brand-type-body-medium)',
            }}
          >
            Confirm card
          </button>
        </div>
      )}
    </div>
  )
}
