import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { SWIPE_QUIZZES, type SwipeStatement } from '../data/swipeQuizzes'

const SWIPE_THRESHOLD = 80
const ROTATION_FACTOR = 0.12
const FEEDBACK_DURATION = 1200

// ─── Back chevron (dark, for light bg) ───────────────────────────────────────
function ChevronLeftDark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="var(--f-brand-color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Swipe direction indicator ──────────────────────────────────────────────
function SwipeLabel({
  direction,
  opacity,
}: {
  direction: 'true' | 'false'
  opacity: number
}) {
  const isTrue = direction === 'true'
  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--f-brand-space-sm)',
        ...(isTrue ? { right: 'var(--f-brand-space-sm)' } : { left: 'var(--f-brand-space-sm)' }),
        padding: 'var(--sp-2) var(--sp-4)',
        borderRadius: 'var(--r-sm)',
        border: `2px solid ${isTrue ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
        color: isTrue ? 'var(--f-brand-color-text-success)' : 'var(--f-brand-color-text-error)',
        fontFamily: 'var(--f-brand-type-headline-medium-family)',
        fontSize: 'var(--f-brand-type-headline-medium-size)',
        fontWeight: 'var(--f-brand-type-headline-medium-weight)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase' as const,
        opacity,
        transform: `rotate(${isTrue ? -12 : 12}deg)`,
        transition: 'opacity 80ms ease',
        pointerEvents: 'none' as const,
        zIndex: 10,
      }}
    >
      {isTrue ? 'TRUE' : 'FALSE'}
    </div>
  )
}

// ─── Feedback overlay after answer ──────────────────────────────────────────
function FeedbackOverlay({
  correct,
  explanation,
  visible,
}: {
  correct: boolean
  explanation: string
  visible: boolean
}) {
  const bgColor = correct
    ? 'var(--f-brand-color-background-success-accent)'
    : 'var(--f-brand-color-background-error)'
  const borderColor = correct
    ? 'var(--f-brand-color-border-success)'
    : 'var(--f-brand-color-border-error)'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-4)',
        padding: 'var(--sp-8)',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--f-brand-radius-outer)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: `opacity 320ms var(--ease-out), transform 320ms var(--ease-out)`,
        pointerEvents: 'none' as const,
        zIndex: 20,
      }}
    >
      {/* Result icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: correct
            ? 'var(--f-brand-color-background-success-accent)'
            : 'var(--f-brand-color-background-error)',
          border: `2px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {correct ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="var(--f-brand-color-text-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="var(--f-brand-color-text-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--f-brand-type-headline-medium-family)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--f-brand-type-headline-medium-weight)',
          color: correct ? 'var(--f-brand-color-text-success)' : 'var(--f-brand-color-text-error)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {correct ? 'Correct!' : 'Wrong!'}
      </span>

      {/* Explanation */}
      <span
        style={{
          fontFamily: 'var(--f-brand-type-body-medium-family)',
          fontSize: 'var(--text-sm)',
          color: 'var(--f-brand-color-text-secondary)',
          textAlign: 'center',
          lineHeight: 'var(--leading-snug)',
          maxWidth: 260,
        }}
      >
        {explanation}
      </span>
    </div>
  )
}

// ─── Statement card ─────────────────────────────────────────────────────────
function StatementCard({
  statement,
  offsetX,
  isDragging,
  feedbackState,
  exitDirection,
}: {
  statement: SwipeStatement
  offsetX: number
  isDragging: boolean
  feedbackState: 'correct' | 'incorrect' | null
  exitDirection: 'left' | 'right' | null
}) {
  const rotation = offsetX * ROTATION_FACTOR
  const trueOpacity = Math.max(0, Math.min(1, offsetX / SWIPE_THRESHOLD))
  const falseOpacity = Math.max(0, Math.min(1, -offsetX / SWIPE_THRESHOLD))

  // Exit animation
  let translateX = offsetX
  let translateY = 0
  let opacity = 1
  let scale = 1

  if (exitDirection) {
    translateX = exitDirection === 'right' ? 500 : -500
    translateY = 60
    opacity = 0
  }

  if (feedbackState && !exitDirection) {
    translateX = 0
    scale = 0.98
  }

  // Dynamic border color
  let borderColor = 'var(--f-brand-color-border-default)'
  if (feedbackState === 'correct') {
    borderColor = 'var(--f-brand-color-border-success)'
  } else if (feedbackState === 'incorrect') {
    borderColor = 'var(--f-brand-color-border-error)'
  } else if (trueOpacity > 0.3) {
    borderColor = 'var(--f-brand-color-border-success)'
  } else if (falseOpacity > 0.3) {
    borderColor = 'var(--f-brand-color-border-error)'
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-4)',
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${exitDirection ? (exitDirection === 'right' ? 20 : -20) : rotation}deg) scale(${scale})`,
        opacity,
        transition: isDragging
          ? 'none'
          : exitDirection
          ? `transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)`
          : `transform var(--dur-slow) var(--ease-out), opacity var(--dur-slow) var(--ease-out)`,
        willChange: 'transform',
        zIndex: 5,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 340,
          aspectRatio: '3 / 4',
          borderRadius: 'var(--f-brand-radius-outer)',
          background: 'var(--f-brand-color-background-light)',
          border: `1.5px solid ${borderColor}`,
          boxShadow: 'var(--f-brand-shadow-large)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-8)',
          overflow: 'hidden',
          transition: isDragging
            ? 'border-color 120ms ease, box-shadow 120ms ease'
            : 'border-color 320ms ease, box-shadow 320ms ease',
        }}
      >
        {/* Swipe labels */}
        <SwipeLabel direction="true" opacity={trueOpacity} />
        <SwipeLabel direction="false" opacity={falseOpacity} />

        {/* Feedback overlay */}
        <FeedbackOverlay
          correct={feedbackState === 'correct'}
          explanation={statement.explanation}
          visible={feedbackState !== null}
        />

        {/* Statement text */}
        <div
          style={{
            fontFamily: 'var(--f-brand-type-body-medium-family)',
            fontSize: 'var(--f-brand-type-body-medium-size)',
            fontWeight: 'var(--f-brand-type-body-medium-weight)',
            color: 'var(--f-brand-color-text-primary)',
            lineHeight: 'var(--leading-snug)',
            textAlign: 'center',
            opacity: feedbackState ? 0 : 1,
            transition: 'opacity 200ms ease',
            zIndex: 1,
          }}
        >
          {statement.statement}
        </div>

        {/* Instruction hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--sp-6)',
            fontFamily: 'var(--f-brand-type-body-medium-family)',
            fontSize: 'var(--text-xs)',
            color: 'var(--f-brand-color-text-secondary)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            opacity: feedbackState ? 0 : 0.6,
            transition: 'opacity 200ms ease',
          }}
        >
          Swipe to answer
        </div>
      </div>
    </div>
  )
}

// ─── Background card (next card preview) ────────────────────────────────────
function BackgroundCard({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-4)',
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          aspectRatio: '3 / 4',
          borderRadius: 'var(--f-brand-radius-outer)',
          background: 'var(--f-brand-color-background-light)',
          border: '1.5px solid var(--f-brand-color-border-default)',
          boxShadow: 'var(--f-brand-shadow-medium)',
          opacity: visible ? 0.5 : 0,
          transform: visible ? 'scale(0.92)' : 'scale(0.85)',
          transition: `opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)`,
        }}
      />
    </div>
  )
}

// ─── Progress bar (FDS pattern from Quiz page) ──────────────────────────────
function ProgressBar({
  current,
  total,
  revealed,
}: {
  current: number
  total: number
  revealed: boolean
}) {
  return (
    <div style={{ flex: 1, height: 4, background: 'var(--f-brand-color-background-disabled)', borderRadius: 2, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${((current + (revealed ? 1 : 0)) / total) * 100}%`,
          background: 'var(--f-brand-color-background-primary)',
          borderRadius: 2,
          transition: 'width 300ms ease',
        }}
      />
    </div>
  )
}

// ─── Swipe action buttons ───────────────────────────────────────────────────
function SwipeActions({
  onSwipe,
  disabled,
}: {
  onSwipe: (dir: 'left' | 'right') => void
  disabled: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-10)',
      }}
    >
      {/* False button */}
      <button
        onClick={() => onSwipe('left')}
        disabled={disabled}
        aria-label="False"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: `2px solid var(--f-brand-color-border-error)`,
          background: 'var(--f-brand-color-background-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: `transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)`,
          boxShadow: 'var(--f-brand-shadow-medium)',
        }}
        onPointerDown={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(0.9)'
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="var(--f-brand-color-text-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* True button */}
      <button
        onClick={() => onSwipe('right')}
        disabled={disabled}
        aria-label="True"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: `2px solid var(--f-brand-color-border-success)`,
          background: 'var(--f-brand-color-background-success-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: `transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out)`,
          boxShadow: 'var(--f-brand-shadow-medium)',
        }}
        onPointerDown={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(0.9)'
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="var(--f-brand-color-text-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main SwipeQuiz route ───────────────────────────────────────────────────
export default function SwipeQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx = quizId
    ? SWIPE_QUIZZES.findIndex((q) => q.id === quizId)
    : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0
  const quiz = SWIPE_QUIZZES[resolvedIdx]
  const total = quiz.statements.length

  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<(boolean | null)[]>(
    () => Array(total).fill(null) as (boolean | null)[],
  )
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [feedbackState, setFeedbackState] = useState<'correct' | 'incorrect' | null>(null)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [enterAnim, setEnterAnim] = useState(true)

  const dragStartX = useRef(0)
  const cardAreaRef = useRef<HTMLDivElement>(null)
  const statement = quiz.statements[currentIdx]

  // Entrance animation for new cards
  useEffect(() => {
    setEnterAnim(true)
    const raf = requestAnimationFrame(() => {
      setEnterAnim(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [currentIdx])

  // ── Handle answer logic ───────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (swipedRight: boolean) => {
      if (isTransitioning || feedbackState) return

      const correct = swipedRight === statement.isTrue
      setIsTransitioning(true)
      setFeedbackState(correct ? 'correct' : 'incorrect')
      setOffsetX(0)

      if (correct) {
        setScore((s) => s + 1)
      }

      setResults((prev) => {
        const next = [...prev]
        next[currentIdx] = correct
        return next
      })

      track('swipe_quiz_answer', {
        quizId: quiz.id,
        statementId: statement.id,
        swipedRight,
        correct,
      })

      // Show feedback, then exit card
      setTimeout(() => {
        setExitDirection(swipedRight ? 'right' : 'left')

        // After exit animation, advance
        setTimeout(() => {
          if (currentIdx < total - 1) {
            setCurrentIdx((i) => i + 1)
            setFeedbackState(null)
            setExitDirection(null)
            setIsTransitioning(false)
            setOffsetX(0)
          } else {
            // Quiz complete
            const finalScore = correct ? score + 1 : score
            addPoints(finalScore)
            recordQuizResult(quiz.id, finalScore, total)
            track('swipe_quiz_completed', {
              quizId: quiz.id,
              score: finalScore,
              total,
            })
            navigate('/results', {
              state: { score: finalScore, total, quizTitle: quiz.title },
            })
          }
        }, 420)
      }, FEEDBACK_DURATION)
    },
    [
      isTransitioning,
      feedbackState,
      statement,
      currentIdx,
      total,
      score,
      quiz,
      addPoints,
      recordQuizResult,
      navigate,
    ],
  )

  // ── Swipe via buttons ─────────────────────────────────────────────────────
  const handleButtonSwipe = useCallback(
    (dir: 'left' | 'right') => {
      handleAnswer(dir === 'right')
    },
    [handleAnswer],
  )

  // ── Touch / pointer handlers ──────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isTransitioning || feedbackState) return
      setIsDragging(true)
      dragStartX.current = e.clientX
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [isTransitioning, feedbackState],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartX.current
      setOffsetX(dx)
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
      handleAnswer(offsetX > 0)
    } else {
      // Spring back
      setOffsetX(0)
    }
  }, [isDragging, offsetX, handleAnswer])

  // ── Back handler ──────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    track('swipe_quiz_abandoned', { quizId: quiz.id, currentIdx })
    navigate(-1)
  }, [quiz.id, currentIdx, navigate])

  if (!quiz || !statement) return null

  return (
    <Screen>
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          background: 'var(--f-brand-color-background-default)',
        }}
      >
        {/* ── Top bar ────────────────────────────────────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
            }}
          >
            <button onClick={handleBack} className="f-btn-icon" aria-label="Back">
              <ChevronLeftDark />
            </button>

            <ProgressBar
              current={currentIdx}
              total={total}
              revealed={feedbackState !== null}
            />

            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--f-brand-color-text-secondary)',
                flexShrink: 0,
                fontFamily: 'var(--f-brand-type-body-medium-family)',
              }}
            >
              {currentIdx + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Card area ─────────────────────────────────────────── */}
        <div
          ref={cardAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            flex: 1,
            position: 'relative',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Next card preview */}
          <BackgroundCard visible={currentIdx < total - 1} />

          {/* Active card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: enterAnim ? 0 : 1,
              transform: enterAnim ? 'scale(0.9)' : 'scale(1)',
              transition: enterAnim ? 'none' : `opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)`,
            }}
          >
            <StatementCard
              statement={statement}
              offsetX={offsetX}
              isDragging={isDragging}
              feedbackState={feedbackState}
              exitDirection={exitDirection}
            />
          </div>
        </div>

        {/* ── Direction labels ──────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: `0 var(--sp-8)`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--f-brand-type-headline-medium-family)',
              fontSize: 'var(--text-xs)',
              color: 'var(--f-brand-color-text-error)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              fontWeight: 'var(--f-brand-type-headline-medium-weight)',
              opacity: 0.6,
            }}
          >
            False
          </span>
          <span
            style={{
              fontFamily: 'var(--f-brand-type-headline-medium-family)',
              fontSize: 'var(--text-xs)',
              color: 'var(--f-brand-color-text-success)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              fontWeight: 'var(--f-brand-type-headline-medium-weight)',
              opacity: 0.6,
            }}
          >
            True
          </span>
        </div>

        {/* ── Swipe action buttons ─────────────────────────────── */}
        <div
          style={{
            padding: 'var(--sp-4) var(--sp-4) var(--sp-8)',
            flexShrink: 0,
          }}
        >
          <SwipeActions
            onSwipe={handleButtonSwipe}
            disabled={isTransitioning || feedbackState !== null}
          />
        </div>
      </div>
    </Screen>
  )
}
