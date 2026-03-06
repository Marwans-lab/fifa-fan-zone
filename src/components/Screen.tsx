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

function StatusBar() {
  const time = useClockTime()
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      pointerEvents: 'none',
    }}>
      {/* Time */}
      <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: '-apple-system, "SF Pro Text", sans-serif', letterSpacing: 0 }}>
        {time}
      </span>
      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="white" aria-hidden="true">
          <rect x="0"    y="8"   width="3" height="4"  rx="0.8" />
          <rect x="4.5"  y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="9"    y="3"   width="3" height="9"  rx="0.8" />
          <rect x="13.5" y="0"   width="3" height="12" rx="0.8" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <circle cx="8" cy="10.5" r="1.5" fill="white" />
          <path d="M4 7.2C5.3 5.8 6.6 5 8 5s2.7.8 4 2.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M1.5 4.5C3.7 2.1 5.7 1 8 1s4.3 1.1 6.5 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 25, height: 12,
            border: '1.5px solid rgba(255,255,255,0.85)',
            borderRadius: 3.5,
            padding: '2px 2px',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ width: '75%', height: '100%', background: '#fff', borderRadius: 1.5 }} />
          </div>
          {/* Nub */}
          <div style={{
            position: 'absolute', right: -4,
            width: 2.5, height: 5,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '0 1.5px 1.5px 0',
          }} />
        </div>
      </div>
    </div>
  )
}

function HomeIndicator() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: 8, left: '50%',
        transform: 'translateX(-50%)',
        width: 134, height: 5,
        background: 'rgba(255,255,255,0.28)',
        borderRadius: 3,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    />
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingTop: 44,
          paddingBottom: 34,
          ...(centered ? { alignItems: 'center', justifyContent: 'center' } : {}),
          ...style,
        }}
        className={className}
      >
        {children}
      </div>
      <HomeIndicator />
    </>
  )
}
