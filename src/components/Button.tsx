import type { ButtonHTMLAttributes, CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  style,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const extraStyle: CSSProperties = {
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  }

  return (
    <button
      {...props}
      disabled={disabled}
      className={`btn btn-${variant}${className ? ' ' + className : ''}`}
      style={extraStyle}
    >
      {children}
    </button>
  )
}
