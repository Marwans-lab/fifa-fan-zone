import type { CSSProperties, ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  className?: string
  centered?: boolean
  style?: CSSProperties
}

export default function Screen({ children, className = '', centered = false, style }: ScreenProps) {
  return (
    <>
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
