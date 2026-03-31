import type { CSSProperties, ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  className?: string
  centered?: boolean
  style?: CSSProperties
}

export default function Screen({ children, className = '', centered = false, style }: ScreenProps) {
  const classes = ['f-screen', centered && 'f-screen--centered', className].filter(Boolean).join(' ')

  return (
    <div className={classes} data-component="screen" style={style}>
      {children}
    </div>
  )
}
