interface SpinnerProps {
  fullScreen?: boolean
  size?: number
}

export default function Spinner({ fullScreen = false, size = 32 }: SpinnerProps) {
  const spinner = (
    <svg
      className="f-spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="var(--c-lt-border)" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--c-lt-brand)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )

  if (!fullScreen) return spinner

  return (
    <div className="f-spinner--fullscreen">
      {spinner}
      <span className="f-spinner__label">
        FIFA Fan Zone
      </span>
    </div>
  )
}
