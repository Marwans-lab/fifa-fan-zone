import type { ButtonHTMLAttributes, ReactNode } from 'react'
import '../styles/fds-button.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'white-outlined' | 'white-filled'
type Size = 'default' | 'sm' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    'f-button',
    variant !== 'primary' ? `f-button--${variant}` : '',
    size !== 'default' ? `f-button--${size}` : '',
    fullWidth ? 'f-button--full-width' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const isDisabled = disabled || loading

  return (
    <button className={classes}
      {...props}
      data-component="button"
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="f-button__spinner" aria-hidden="true" />
      ) : (
        iconLeft && <span className="f-button__icon" aria-hidden="true">{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span className="f-button__icon" aria-hidden="true">{iconRight}</span>
      )}
    </button>
  )
}
