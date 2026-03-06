interface SpinnerProps {
  fullScreen?: boolean
  size?: number
}

export default function Spinner({ fullScreen = false, size = 32 }: SpinnerProps) {
  const spinner = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      style={{ animation: 'fanzone-spin 0.8s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`@keyframes fanzone-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )

  if (!fullScreen) return spinner

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-5)',
        background: 'var(--c-bg)',
      }}
    >
      {spinner}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-light)',
        color: 'var(--c-text-3)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
      }}>
        FIFA Fan Zone
      </span>
    </div>
  )
}
