import { useState, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'

function useClockTime() {
  const fmt = () => {
    const n = new Date()
    return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`
  }
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 10_000)
    return () => clearInterval(id)
  }, [])
  return time
}

function CellSignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="white" aria-hidden="true">
      <rect x="0"    y="9"   width="3" height="3"  rx="0.5" />
      <rect x="4.5"  y="6"   width="3" height="6"  rx="0.5" />
      <rect x="9"    y="3"   width="3" height="9"  rx="0.5" />
      <rect x="13.5" y="0"   width="3" height="12" rx="0.5" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <circle cx="8" cy="11" r="1.5" fill="white" />
      <path d="M4.6 8C5.8 6.7 6.8 6 8 6s2.2.7 3.4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M1.8 5.2C3.8 3 5.8 2 8 2s4.2 1 6.2 3.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
      <rect x="2" y="2" width="16.5" height="9" rx="2" fill="white" />
      <path d="M24 4.5v4a2.5 2.5 0 0 0 0-4z" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

function StatusBar() {
  const time = useClockTime()
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        paddingTop: 10,
        zIndex: 9999,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }}
    >
      <span style={{
        fontSize: 15, fontWeight: 600, color: '#ffffff',
        fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
        letterSpacing: -0.3, lineHeight: 1,
      }}>
        {time}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CellSignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  )
}

interface ScreenProps {
  children: ReactNode
  className?: string
  centered?: boolean
  style?: CSSProperties
}

export default function Screen({ children, className = '', centered = false, style }: ScreenProps) {
  return (
    <>
      <StatusBar />

      {/* ── Ambient background blobs ──────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        <div
          className="animate-blob-slow"
          style={{ position: 'absolute', top: '5%', left: '-10%', width: 500, height: 500, background: 'rgba(142,33,87,0.3)', borderRadius: '50%', filter: 'blur(120px)' }}
        />
        <div
          className="animate-blob-reverse"
          style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 600, height: 600, background: 'rgba(142,33,87,0.4)', borderRadius: '50%', filter: 'blur(140px)' }}
        />
        <div
          className="animate-blob-float"
          style={{ position: 'absolute', top: '45%', left: '15%', width: 350, height: 350, background: 'rgba(142,33,87,0.2)', borderRadius: '50%', filter: 'blur(100px)' }}
        />
      </div>

      {/* ── Noise texture overlay ─────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, opacity: 0.02, pointerEvents: 'none', zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingTop: 50,
          ...(centered ? { alignItems: 'center', justifyContent: 'center' } : {}),
          ...style,
        }}
        className={className}
      >
        {children}
      </div>
    </>
  )
}
