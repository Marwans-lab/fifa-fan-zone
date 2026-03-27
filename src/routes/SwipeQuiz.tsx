import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore, FLOW_IDS, type FlowId } from '../store/useStore'
import { SWIPE_QUIZZES, type SwipeStatement } from '../data/swipeQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const SWIPE_THRESHOLD = 80
const ROTATION_FACTOR = 0.12
const FEEDBACK_DURATION = 1200

// ─── Swipe direction indicator ──────────────────────────────────────────────
function SwipeLabel({
  direction,
  opacity,
  label,
}: {
  direction: 'true' | 'false'
  opacity: number
  label: string
}) {
  const isTrue = direction === 'true'
  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--f-brand-space-lg)',
        ...(isTrue ? { right: 'var(--f-brand-space-lg)' } : { left: 'var(--f-brand-space-lg)' }),
        padding: 'var(--f-brand-space-xs) var(--f-brand-space-md)',
        borderRadius: 'var(--f-brand-radius-base)',
        border: `2px solid ${isTrue ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)'}`,
        color: isTrue ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)',
        font: 'var(--f-brand-type-headline-medium)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        opacity,
        transform: `rotate(${isTrue ? -12 : 12}deg)`,
        transition: 'opacity var(--f-brand-motion-duration-fast) var(--f-brand-motion-easing-default)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {label}
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
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--f-brand-space-md)',
        padding: 'var(--f-brand-space-xl)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Result icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: correct ? 'var(--f-brand-color-background-success-accent)' : 'var(--f-brand-color-background-error)',
          border: `2px solid ${correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-2xl)',
          boxShadow: `0 0 40px ${correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
        }}
      >
        {correct ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="var(--f-brand-color-border-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="var(--f-brand-color-status-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          font: 'var(--f-brand-type-title-3)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)',
          color: correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {correct ? 'Correct!' : 'Wrong!'}
      </span>

      {/* Explanation */}
      <span
        style={{
          font: 'var(--f-brand-type-caption)',
          fontSize: 'var(--text-sm)',
          color: 'var(--f-brand-color-text-subtle)',
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
  labels,
}: {
  statement: SwipeStatement
  offsetX: number
  isDragging: boolean
  feedbackState: 'correct' | 'incorrect' | null
  exitDirection: 'left' | 'right' | null
  labels: { right: string; left: string }
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

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--f-brand-space-md)',
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${exitDirection ? (exitDirection === 'right' ? 20 : -20) : rotation}deg) scale(${scale})`,
        opacity,
        transition: isDragging
          ? 'none'
          : exitDirection
          ? 'transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)'
          : 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
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
          border: `1.5px solid ${
            feedbackState === 'correct'
              ? 'var(--f-brand-color-border-success)'
              : feedbackState === 'incorrect'
              ? 'var(--f-brand-color-border-error)'
              : trueOpacity > 0.3
              ? 'var(--f-brand-color-border-success)'
              : falseOpacity > 0.3
              ? 'var(--f-brand-color-border-error)'
              : 'var(--f-brand-color-border-default)'
          }`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: feedbackState === 'correct'
            ? '0 0 60px var(--f-brand-color-border-success), var(--f-brand-shadow-large)'
            : feedbackState === 'incorrect'
            ? '0 0 60px var(--f-brand-color-border-error), var(--f-brand-shadow-large)'
            : 'var(--f-brand-shadow-large)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--f-brand-space-xl)',
          overflow: 'hidden',
          transition: isDragging
            ? 'border-color var(--f-brand-motion-duration-fast) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-fast) var(--f-brand-motion-easing-default)'
            : 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
        }}
      >
        {/* Accent glow at top */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: statement.accentColor,
            filter: 'blur(80px)',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        {/* Swipe labels */}
        <SwipeLabel direction="true" opacity={trueOpacity} label={labels.right} />
        <SwipeLabel direction="false" opacity={falseOpacity} label={labels.left} />

        {/* Feedback overlay */}
        <FeedbackOverlay
          correct={feedbackState === 'correct'}
          explanation={statement.explanation}
          visible={feedbackState !== null}
        />

        {/* Statement text */}
        <div
          style={{
            font: 'var(--f-brand-type-title-3)',
            color: 'var(--f-brand-color-text-default)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            textAlign: 'center',
            opacity: feedbackState ? 0 : 1,
            transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
            zIndex: 1,
          }}
        >
          {statement.statement}
        </div>

        {/* Instruction hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--f-brand-space-lg)',
            font: 'var(--f-brand-type-caption)',
            fontSize: 'var(--text-xs)',
            color: 'var(--f-brand-color-text-muted)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            opacity: feedbackState ? 0 : 0.6,
            transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
        padding: 'var(--f-brand-space-md)',
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
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: visible ? 0.5 : 0,
          transform: visible ? 'scale(0.92)' : 'scale(0.85)',
          transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
        }}
      />
    </div>
  )
}

// ─── Progress dots ──────────────────────────────────────────────────────────
function ProgressDots({
  total,
  current,
  results,
}: {
  total: number
  current: number
  results: (boolean | null)[]
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--f-brand-space-xs)',
        flexWrap: 'wrap',
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i]
        const isCurrent = i === current
        return (
          <div
            key={i}
            style={{
              width: isCurrent ? 24 : 8,
              height: 8,
              borderRadius: 'var(--f-brand-radius-rounded)',
              background:
                result === true
                  ? 'var(--f-brand-color-border-success)'
                  : result === false
                  ? 'var(--f-brand-color-status-error)'
                  : isCurrent
                  ? 'var(--f-brand-color-text-default)'
                  : 'var(--f-brand-color-background-light)',
              transition: 'all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
              boxShadow: result === true
                ? '0 0 8px var(--f-brand-color-border-success)'
                : result === false
                ? '0 0 8px var(--f-brand-color-border-error)'
                : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Swipe action buttons ───────────────────────────────────────────────────
function SwipeActions({
  onSwipe,
  disabled,
  labels,
}: {
  onSwipe: (dir: 'left' | 'right') => void
  disabled: boolean
  labels: { right: string; left: string }
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--f-brand-space-2xl)',
      }}
    >
      {/* False button */}
      <button
        data-ui="swipe-false-btn"
        onClick={() => onSwipe('left')}
        disabled={disabled}
        aria-label={labels.left}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--f-brand-color-border-error)',
          background: 'var(--f-brand-color-background-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
          boxShadow: 'none',
        }}
        onPointerDown={(e) => {
          if (!disabled) {
            const el = e.currentTarget
            el.style.transform = 'scale(0.9)'
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="var(--f-brand-color-status-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* True button */}
      <button
        data-ui="swipe-true-btn"
        onClick={() => onSwipe('right')}
        disabled={disabled}
        aria-label={labels.right}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--f-brand-color-border-success)',
          background: 'var(--f-brand-color-background-success-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
          boxShadow: 'none',
        }}
        onPointerDown={(e) => {
          if (!disabled) {
            const el = e.currentTarget
            el.style.transform = 'scale(0.9)'
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="var(--f-brand-color-border-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main SwipeQuiz route ───────────────────────────────────────────────────
export default function SwipeQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult, completeFlow } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx = quizId
    ? SWIPE_QUIZZES.findIndex((q) => q.id === quizId)
    : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0
  const quiz = SWIPE_QUIZZES[resolvedIdx]
  const total = quiz.statements.length
  const labels = quiz.labels ?? { right: 'True', left: 'False' }

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
            if ((FLOW_IDS as readonly string[]).includes(quiz.id)) {
              completeFlow(quiz.id as FlowId)
            }
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
      completeFlow,
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
        className="f-page-enter"
        data-page="swipe-quiz"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── Top bar ────────────────────────────────────────────── */}
        <div data-section="header" style={{ padding: 'var(--f-brand-space-md)', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--f-brand-space-sm)',
            }}
          >
            <button onClick={handleBack} className="f-button f-button--ghost" data-ui="back-btn">
              <img src={chevLeft} width={24} height={24} alt="Back" />
            </button>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  font: 'var(--f-brand-type-headline-medium)',
                  fontSize: 'var(--text-md)',
                  color: 'var(--f-brand-color-text-default)',
                  letterSpacing: 'var(--tracking-snug)',
                }}
              >
                {quiz.title}
              </span>
            </div>

            {/* Score badge */}
            <div
              style={{
                minWidth: 40,
                height: 28,
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'var(--f-brand-color-background-light)',
                border: '1px solid var(--f-brand-color-border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 var(--f-brand-space-xs)',
                gap: 'var(--f-brand-space-2xs)',
              }}
            >
              <span
                style={{
                  font: 'var(--f-brand-type-caption-medium)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--f-brand-color-accent)',
                }}
              >
                {score}
              </span>
              <span
                style={{
                  font: 'var(--f-brand-type-caption)',
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--f-brand-color-text-muted)',
                }}
              >
                /{total}
              </span>
            </div>
          </div>
        </div>

        {/* ── Progress dots ─────────────────────────────────────── */}
        <div data-section="progress-dots" style={{ padding: '0 var(--f-brand-space-md) var(--f-brand-space-md)', flexShrink: 0 }}>
          <ProgressDots total={total} current={currentIdx} results={results} />
        </div>

        {/* ── Card area ─────────────────────────────────────────── */}
        <div
          data-section="swipe-card"
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
              transition: enterAnim ? 'none' : 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
            }}
          >
            <StatementCard
              statement={statement}
              offsetX={offsetX}
              isDragging={isDragging}
              feedbackState={feedbackState}
              exitDirection={exitDirection}
              labels={labels}
            />
          </div>
        </div>

        {/* ── Direction labels ──────────────────────────────────── */}
        <div
          data-section="swipe-hint"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 var(--f-brand-space-xl)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              font: 'var(--f-brand-type-caption-medium)',
              fontSize: 'var(--text-xs)',
              color: 'var(--f-brand-color-status-error)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              opacity: 0.6,
            }}
          >
            {labels.left}
          </span>
          <span
            style={{
              font: 'var(--f-brand-type-caption-medium)',
              fontSize: 'var(--text-xs)',
              color: 'var(--f-brand-color-border-success)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              opacity: 0.6,
            }}
          >
            {labels.right}
          </span>
        </div>

        {/* ── Swipe action buttons ─────────────────────────────── */}
        <div
          data-section="swipe-actions"
          style={{
            padding: 'var(--f-brand-space-md) var(--f-brand-space-md) var(--f-brand-space-xl)',
            flexShrink: 0,
          }}
        >
          <SwipeActions
            onSwipe={handleButtonSwipe}
            disabled={isTransitioning || feedbackState !== null}
            labels={labels}
          />
        </div>
      </div>
    </Screen>
  )
}
