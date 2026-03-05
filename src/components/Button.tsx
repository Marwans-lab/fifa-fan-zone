import type { ButtonHTMLAttributes, CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: '#ffffff',
    color: 'var(--color-brand)',
  },
  secondary: {
    background: '#1e1e1e',
    color: 'var(--color-text-primary)',
    border: '1.5px solid #3a3a3a',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
  },
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-4) var(--space-6)',
  borderRadius: 'var(--radius-full)',
  fontWeight: 700,
  fontSize: 'var(--font-size-md)',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
  WebkitTapHighlightColor: 'transparent',
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...(fullWidth ? { width: '100%' } : {}),
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...style,
      }}
    >
      {children}
    </button>
  )
}
