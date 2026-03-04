import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error'

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  start: () => Promise<void>
  stop: () => void
  capture: () => string | null  // returns compressed JPEG dataURL or null
}

const CAPTURE_QUALITY = 0.7
const MAX_DIMENSION = 640  // keep memory low

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }

    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: MAX_DIMENSION }, height: { ideal: MAX_DIMENSION } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('active')
    } catch (err) {
      const name = (err as Error).name
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error')
    }
  }, [])

  const capture = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || status !== 'active') return null

    const w = Math.min(video.videoWidth, MAX_DIMENSION)
    const h = Math.min(video.videoHeight, MAX_DIMENSION)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
  }, [status])

  // Stop stream on unmount to avoid resource leak
  useEffect(() => () => { stop() }, [stop])

  return { videoRef, status, start, stop, capture }
}
