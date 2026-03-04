import type { CSSProperties, ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  className?: string
  centered?: boolean
  style?: CSSProperties
}

export default function Screen({ children, className = '', centered = false, style }: ScreenProps) {
  return (
    <div
      style={{
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
  )
}
