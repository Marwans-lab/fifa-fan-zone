import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
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
        top: 'var(--sp-6)',
        ...(isTrue ? { right: 'var(--sp-6)' } : { left: 'var(--sp-6)' }),
        padding: 'var(--sp-2) var(--sp-4)',
        borderRadius: 'var(--r-sm)',
        border: `2px solid ${isTrue ? 'var(--c-correct)' : 'var(--c-error)'}`,
        color: isTrue ? 'var(--c-correct)' : 'var(--c-error)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        fontFamily: 'var(--font-body)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        opacity,
        transform: `rotate(${isTrue ? -12 : 12}deg)`,
        transition: 'opacity 80ms ease',
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
        gap: 'var(--sp-4)',
        padding: 'var(--sp-8)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 320ms var(--ease-out), transform 320ms var(--ease-out)',
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
          background: correct ? 'var(--c-correct-bg)' : 'var(--c-error-bg)',
          border: `2px solid ${correct ? 'var(--c-correct-border)' : 'var(--c-error-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-2xl)',
          boxShadow: `0 0 40px ${correct ? 'var(--c-correct-glow)' : 'var(--c-error-glow)'}`,
        }}
      >
        {correct ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="var(--c-correct)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="var(--c-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)',
          color: correct ? 'var(--c-correct)' : 'var(--c-error)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {correct ? 'Correct!' : 'Wrong!'}
      </span>

      {/* Explanation */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--c-text-2)',
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
        padding: 'var(--sp-4)',
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${exitDirection ? (exitDirection === 'right' ? 20 : -20) : rotation}deg) scale(${scale})`,
        opacity,
        transition: isDragging
          ? 'none'
          : exitDirection
          ? 'transform 400ms var(--ease-out), opacity 400ms var(--ease-out)'
          : 'transform 320ms var(--ease-out), opacity 320ms var(--ease-out)',
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
          borderRadius: 'var(--r-xl)',
          background: 'var(--c-surface)',
          border: `1.5px solid ${
            feedbackState === 'correct'
              ? 'var(--c-correct-border)'
              : feedbackState === 'incorrect'
              ? 'var(--c-error-border)'
              : trueOpacity > 0.3
              ? 'var(--c-correct-border)'
              : falseOpacity > 0.3
              ? 'var(--c-error-border)'
              : 'var(--c-border)'
          }`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: feedbackState === 'correct'
            ? '0 0 60px var(--c-correct-glow), var(--shadow-md)'
            : feedbackState === 'incorrect'
            ? '0 0 60px var(--c-error-glow), var(--shadow-md)'
            : 'var(--shadow-lg)',
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
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--c-text-1)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
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
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-3)',
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
          borderRadius: 'var(--r-xl)',
          background: 'var(--c-surface)',
          border: '1.5px solid var(--c-border)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: visible ? 0.5 : 0,
          transform: visible ? 'scale(0.92)' : 'scale(0.85)',
          transition: 'opacity 320ms var(--ease-out), transform 320ms var(--ease-out)',
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
        gap: 'var(--sp-2)',
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
              borderRadius: 'var(--r-full)',
              background:
                result === true
                  ? 'var(--c-correct)'
                  : result === false
                  ? 'var(--c-error)'
                  : isCurrent
                  ? 'var(--c-text-1)'
                  : 'var(--c-surface-raise)',
              transition: 'all 320ms var(--ease-out)',
              boxShadow: result === true
                ? '0 0 8px var(--c-correct-glow)'
                : result === false
                ? '0 0 8px var(--c-error-glow)'
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
        gap: 'var(--sp-10)',
      }}
    >
      {/* False button */}
      <button
        onClick={() => onSwipe('left')}
        disabled={disabled}
        aria-label={labels.left}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--c-error-border)',
          background: 'var(--c-error-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="var(--c-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* True button */}
      <button
        onClick={() => onSwipe('right')}
        disabled={disabled}
        aria-label={labels.right}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--c-correct-border)',
          background: 'var(--c-correct-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="var(--c-correct)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
            <button onClick={handleBack} className="btn-icon">
              <img src={chevLeft} width={24} height={24} alt="Back" />
            </button>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-md)',
                  fontWeight: 'var(--weight-med)',
                  color: 'var(--c-text-1)',
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
                borderRadius: 'var(--r-full)',
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 var(--sp-2)',
                gap: 'var(--sp-1)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--c-accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--c-text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                /{total}
              </span>
            </div>
          </div>
        </div>

        {/* ── Progress dots ─────────────────────────────────────── */}
        <div style={{ padding: '0 var(--sp-4) var(--sp-4)', flexShrink: 0 }}>
          <ProgressDots total={total} current={currentIdx} results={results} />
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
              transition: enterAnim ? 'none' : 'opacity 320ms var(--ease-out), transform 320ms var(--ease-out)',
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
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 var(--sp-8)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--c-error)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              fontWeight: 'var(--weight-med)',
              opacity: 0.6,
            }}
          >
            {labels.left}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--c-correct)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
              fontWeight: 'var(--weight-med)',
              opacity: 0.6,
            }}
          >
            {labels.right}
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
            labels={labels}
          />
        </div>
      </div>
    </Screen>
  )
}
